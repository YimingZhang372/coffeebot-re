import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useSession } from "@/lib/session";
import { FLOORS, formatSgt } from "@/lib/programme";
import { currentMonth, floorRows, officeTotals } from "@/lib/metrics";
import { auctionBoard, bidFor, clockLabel, dropsDoneIn, pledgeConfig } from "@/lib/pledge";

const Ctx = createContext(null);

const all = async (entity, opts = {}) => {
  const res = await entity.list({ limit: 500, ...opts });
  return Array.isArray(res) ? res : res?.items || [];
};

const nextRef = (rows, prefix, field, start = 1) => {
  const max = rows.reduce((m, r) => {
    const n = parseInt(String(r[field] || "").split("-").pop(), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, start);
  return `${prefix}-${String(max + 1).padStart(5, "0")}`;
};

export function ProgrammeProvider({ children }) {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [collections, setCollections] = useState([]);
  const [reuses, setReuses] = useState([]);
  const [comments, setComments] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [saves, setSaves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [me, setMe] = useState(null);

  const load = useCallback(async () => {
    const [emp, col, reu, com, ple, cer, sav, set] = await Promise.all([
      all(base44.entities.Employee),
      all(base44.entities.Collection),
      all(base44.entities.Reuse),
      all(base44.entities.Comment),
      all(base44.entities.Pledge),
      all(base44.entities.Certificate),
      all(base44.entities.ActivitySave),
      all(base44.entities.ProgrammeSetting),
    ]);
    setEmployees(emp);
    setCollections(col);
    setReuses(reu);
    setComments(com);
    setPledges(ple);
    setCertificates(cer);
    setSaves(sav);
    setSettings(set[0] || null);
    return emp;
  }, []);

  const resolveMe = useCallback(
    async (list) => {
      if (!session?.email) {
        setMe(null);
        return null;
      }
      const found = list.find((e) => e.email?.toLowerCase() === session.email.toLowerCase());
      if (found) {
        setMe(found);
        return found;
      }
      const base = session.email.split("@")[0].replace(/[._]/g, " ");
      const created = await base44.entities.Employee.create({
        refId: `EMP-MB-${900 + Math.floor(Math.random() * 90)}`,
        name: base.replace(/\b\w/g, (c) => c.toUpperCase()),
        email: session.email,
        floorCode: "",
        department: "",
        office: "Marina Bay",
        role: "employee",
        activeMember: false,
        joinedAt: new Date().toISOString(),
        quizCompleted: false,
        quizAnswers: [],
        savedActivities: [],
        showNameDefault: false,
        profileSet: false,
      });
      setMe(created);
      return created;
    },
    [session]
  );

  const loadNotifications = useCallback(async () => {
    if (!session?.email) {
      setNotifications([]);
      return;
    }
    const rows = await base44.entities.Notification.filter(
      { recipientEmail: session.email },
      { sort: "-occurredAt", limit: 60 }
    );
    setNotifications(Array.isArray(rows) ? rows : rows?.items || []);
  }, [session]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const list = await load();
      if (!alive) return;
      await resolveMe(list);
      await loadNotifications();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load, resolveMe, loadNotifications]);

  const refresh = useCallback(async () => {
    const list = await load();
    await resolveMe(list);
    await loadNotifications();
  }, [load, resolveMe, loadNotifications]);

  const eligibleByFloor = useMemo(() => {
    const map = {};
    (settings?.eligibleByFloor || []).forEach((e) => {
      map[e.floorCode] = e.eligible;
    });
    FLOORS.forEach((f) => {
      if (!map[f.code]) map[f.code] = f.eligible;
    });
    return map;
  }, [settings]);

  const month = currentMonth();
  const target = settings?.participationTarget ?? 30;

  const rowsFor = useCallback(
    (m) => floorRows({ month: m, reuses, collections, eligibleByFloor, participationTarget: target }),
    [reuses, collections, eligibleByFloor, target]
  );

  const rows = useMemo(() => rowsFor(month), [rowsFor, month]);
  const prevMonth = "2026-10";
  const prevRows = useMemo(() => rowsFor(prevMonth), [rowsFor]);
  const allRows = useMemo(() => rowsFor(null), [rowsFor]);
  const office = useMemo(() => officeTotals(rows), [rows]);
  const prevOffice = useMemo(() => officeTotals(prevRows), [prevRows]);

  const myRow = useMemo(
    () => (me?.floorCode ? rows.find((r) => r.code === me.floorCode) : null),
    [rows, me]
  );

  const myCollections = useMemo(
    () => collections.filter((c) => c.employeeEmail === me?.email),
    [collections, me]
  );
  const myReuses = useMemo(() => reuses.filter((r) => r.employeeEmail === me?.email), [reuses, me]);
  const myNotifications = useMemo(
    () => notifications.filter((n) => n.recipientEmail === me?.email),
    [notifications, me]
  );
  const unread = myNotifications.filter((n) => !n.read).length;

  const logEvent = useCallback(
    async (payload) => {
      const events = await all(base44.entities.ActivityEvent);
      await base44.entities.ActivityEvent.create({
        refId: nextRef(events, "EV", "refId", 240),
        occurredAt: new Date().toISOString(),
        office: "Marina Bay",
        ...payload,
      });
    },
    []
  );

  const maskLabel = useCallback(
    (email, showName, floorCode) => {
      const e = employees.find((x) => x.email === email);
      if (showName && e) return e.name;
      const n = e ? String(parseInt(String(e.refId).slice(-3), 10) || 1).padStart(3, "0") : "001";
      return `${floorCode} employee #${n}`;
    },
    [employees]
  );

  // ---------- writes ----------
  const recordCollection = useCallback(
    async ({ grams, proofPhotoUrl }) => {
      const refId = nextRef(collections, "COL", "refId", 240);
      const evidenceLevel = proofPhotoUrl ? "Weighed" : "Reported";
      const created = await base44.entities.Collection.create({
        refId,
        employeeEmail: me.email,
        employeeName: me.name,
        employeeRef: me.refId,
        floorCode: me.floorCode,
        office: me.office || "Marina Bay",
        grams: Number(grams),
        evidenceLevel,
        proofPhotoUrl: proofPhotoUrl || "",
        tableStatus: "available",
        occurredAt: new Date().toISOString(),
        groundDropDate: new Date().toISOString().slice(0, 10),
        needsReview: !proofPhotoUrl,
      });
      await logEvent({
        eventType: "collection",
        employeeLabel: maskLabel(me.email, false, me.floorCode),
        employeeEmail: me.email,
        floorCode: me.floorCode,
        quantity: Number(grams),
        quantityUnit: "g collected",
        status: evidenceLevel,
        actor: "Self-service",
        entityRef: refId,
        detail: `Weighed at the ${me.floorCode} collection table.`,
        photoUrl: proofPhotoUrl || "",
      });
      await refresh();
      return created;
    },
    [collections, me, logEvent, maskLabel, refresh]
  );

  const submitReuse = useCallback(
    async ({ activityKey, grams, note, photoUrl, showName, inspiredByRef }) => {
      const refId = nextRef(reuses, "RR", "refId", 400);
      const created = await base44.entities.Reuse.create({
        refId,
        employeeEmail: me.email,
        employeeName: me.name,
        employeeRef: me.refId,
        floorCode: me.floorCode,
        office: me.office || "Marina Bay",
        activityKey,
        grams: Number(grams),
        note,
        photoUrl: photoUrl || "",
        showName: !!showName,
        status: "pending",
        evidenceLevel: "Reported",
        inspiredByRef: inspiredByRef || "",
        progressUpdates: [],
        reactions: { appreciate: 0, trying: 0, impressive: 0 },
        reactedFloors: [],
        commentCount: 0,
        reported: false,
        occurredAt: new Date().toISOString(),
      });
      await logEvent({
        eventType: "reuse.submitted",
        employeeLabel: maskLabel(me.email, showName, me.floorCode),
        employeeEmail: me.email,
        floorCode: me.floorCode,
        quantity: Number(grams),
        quantityUnit: "g reused",
        status: "Pending validation",
        actor: "Employee",
        entityRef: refId,
        detail: note,
        photoUrl: photoUrl || "",
      });
      const champion = employees.find((e) => e.floorCode === me.floorCode && e.role === "champion");
      if (champion) {
        await base44.entities.Notification.create({
          recipientEmail: champion.email,
          type: "floor",
          title: `${refId} is waiting for validation`,
          body: `${me.floorCode} has a new reuse record to review.`,
          link: "/community",
          read: false,
          private: true,
          occurredAt: new Date().toISOString(),
        });
      }
      await refresh();
      return created;
    },
    [reuses, me, logEvent, maskLabel, employees, refresh]
  );

  const reviewReuse = useCallback(
    async (reuse, decision, reason = "") => {
      const actor = me?.name || "Floor Champion";
      await base44.entities.Reuse.update(reuse.id, {
        status: decision,
        rejectionReason: decision === "rejected" ? reason : "",
        validatedBy: actor,
        validatedAt: new Date().toISOString(),
        evidenceLevel: decision === "validated" ? "Validated" : "Reported",
      });
      await logEvent({
        eventType: decision === "validated" ? "post.validated" : "post.rejected",
        employeeLabel: maskLabel(reuse.employeeEmail, reuse.showName, reuse.floorCode),
        employeeEmail: reuse.employeeEmail,
        floorCode: reuse.floorCode,
        quantity: reuse.grams,
        quantityUnit: "g reused",
        status: decision === "validated" ? "Validated" : "Rejected",
        actor,
        entityRef: reuse.refId,
        detail: decision === "validated" ? "Floor Champion validated the record." : reason,
        photoUrl: reuse.photoUrl || "",
      });
      await base44.entities.Notification.create({
        recipientEmail: reuse.employeeEmail,
        type: "validation",
        title: decision === "validated" ? "Your reuse record was validated" : "Your reuse record was rejected",
        body:
          decision === "validated"
            ? `${actor} validated ${reuse.refId}. 0.5 volunteering hours added.`
            : `${actor} rejected ${reuse.refId}: ${reason}`,
        link: "/me",
        read: false,
        private: true,
        occurredAt: new Date().toISOString(),
      });
      await refresh();
    },
    [me, logEvent, maskLabel, refresh]
  );

  const addComment = useCallback(
    async (reuse, body, parentId = "") => {
      const created = await base44.entities.Comment.create({
        refId: `CM-${Date.now().toString().slice(-6)}`,
        reuseRefId: reuse.refId,
        employeeEmail: me.email,
        employeeName: me.name,
        floorCode: me.floorCode,
        body,
        parentId: parentId || "",
        occurredAt: new Date().toISOString(),
      });
      await base44.entities.Reuse.update(reuse.id, { commentCount: (reuse.commentCount || 0) + 1 });
      await logEvent({
        eventType: "comment",
        employeeLabel: maskLabel(me.email, false, me.floorCode),
        employeeEmail: me.email,
        floorCode: me.floorCode,
        quantity: 0,
        status: "Published",
        actor: `${me.floorCode} colleague`,
        entityRef: reuse.refId,
        detail: body,
      });
      if (reuse.employeeEmail !== me.email) {
        await base44.entities.Notification.create({
          recipientEmail: reuse.employeeEmail,
          type: "comment",
          title: "A colleague commented on your post",
          body: `“${body.slice(0, 90)}”`,
          link: "/community",
          read: false,
          private: true,
          occurredAt: new Date().toISOString(),
        });
      }
      const mention = body.match(/@(L\d{1,2})/);
      if (mention) {
        const champ = employees.find((e) => e.floorCode === mention[1] && e.role === "champion");
        if (champ) {
          await base44.entities.Notification.create({
            recipientEmail: champ.email,
            type: "mention",
            title: `${me.floorCode} mentioned ${mention[1]}`,
            body: body.slice(0, 100),
            link: "/community",
            read: false,
            private: true,
            occurredAt: new Date().toISOString(),
          });
        }
      }
      await refresh();
      return created;
    },
    [me, logEvent, maskLabel, employees, refresh]
  );

  const toggleReaction = useCallback(
    async (reuse, type) => {
      const existing = await base44.entities.Reaction.filter({
        reuseRefId: reuse.refId,
        employeeEmail: me.email,
        type,
      });
      const list = Array.isArray(existing) ? existing : existing?.items || [];
      const reactions = { appreciate: 0, trying: 0, impressive: 0, ...(reuse.reactions || {}) };
      const floors = new Set(reuse.reactedFloors || []);
      if (list.length) {
        await base44.entities.Reaction.delete(list[0].id);
        reactions[type] = Math.max(0, (reactions[type] || 0) - 1);
      } else {
        await base44.entities.Reaction.create({
          reuseRefId: reuse.refId,
          employeeEmail: me.email,
          floorCode: me.floorCode,
          type,
        });
        reactions[type] = (reactions[type] || 0) + 1;
        floors.add(me.floorCode);
      }
      await base44.entities.Reuse.update(reuse.id, { reactions, reactedFloors: [...floors] });
      if (!list.length && reuse.employeeEmail !== me.email) {
        await base44.entities.Notification.create({
          recipientEmail: reuse.employeeEmail,
          type: "like",
          title: `${me.floorCode} reacted to your post`,
          body: `Your record ${reuse.refId} has a new reaction.`,
          link: "/community",
          read: false,
          private: true,
          occurredAt: new Date().toISOString(),
        });
      }
      await refresh();
    },
    [me, refresh]
  );

  const saveActivity = useCallback(
    async (activityKey, sourceRef = "") => {
      const already = saves.find((s) => s.activityKey === activityKey && s.employeeEmail === me.email);
      if (already) return;
      await base44.entities.ActivitySave.create({
        employeeEmail: me.email,
        activityKey,
        savedAt: new Date().toISOString(),
        sourceRef,
      });
      await base44.entities.Employee.update(me.id, {
        savedActivities: [...new Set([...(me.savedActivities || []), activityKey])],
      });
      await refresh();
    },
    [saves, me, refresh]
  );

  const addProgressUpdate = useCallback(
    async (reuse, { photoUrl, note }) => {
      const updates = [
        ...(reuse.progressUpdates || []),
        { date: new Date().toISOString(), photoUrl, note },
      ];
      await base44.entities.Reuse.update(reuse.id, { progressUpdates: updates });
      await refresh();
    },
    [refresh]
  );

  const updateMe = useCallback(
    async (patch) => {
      if (!me) return;
      await base44.entities.Employee.update(me.id, patch);
      await refresh();
    },
    [me, refresh]
  );

  const markAllRead = useCallback(async () => {
    const unreadOnes = myNotifications.filter((n) => !n.read);
    await Promise.all(unreadOnes.map((n) => base44.entities.Notification.update(n.id, { read: true })));
    await loadNotifications();
  }, [myNotifications, loadNotifications]);

  const saveSettings = useCallback(
    async (patch, detail) => {
      if (!settings) return;
      await base44.entities.ProgrammeSetting.update(settings.id, {
        ...patch,
        lastChangedBy: me?.name || "Programme administrator",
        lastChangedAt: new Date().toISOString(),
      });
      await logEvent({
        eventType: "settings.changed",
        employeeLabel: "Programme administrator",
        employeeEmail: me?.email || "",
        floorCode: "ALL",
        quantity: 0,
        status: "Applied",
        actor: me?.name || "Programme administrator",
        entityRef: "Programme settings",
        detail,
        auditable: true,
      });
      await refresh();
    },
    [settings, me, logEvent, refresh]
  );

  const setCertificateStatus = useCallback(
    async (cert, status, reason = "") => {
      await base44.entities.Certificate.update(cert.id, {
        status,
        issuedBy: status === "issued" ? me?.name || "Programme administrator" : cert.issuedBy,
        issuedAt: status === "issued" ? new Date().toISOString() : cert.issuedAt,
        revokedReason: reason,
      });
      await logEvent({
        eventType: status === "issued" ? "certificate.issued" : "certificate.revoked",
        employeeLabel: "Programme administrator",
        employeeEmail: me?.email || "",
        floorCode: cert.floorCode,
        office: cert.office,
        quantity: cert.kgReused,
        quantityUnit: "kg reused",
        status: status === "issued" ? "Issued" : "Revoked",
        actor: me?.name || "Programme administrator",
        entityRef: cert.certId,
        detail:
          status === "issued"
            ? `Certificate issued for ${cert.periodLabel}.`
            : `Certificate revoked: ${reason}`,
        auditable: true,
      });
      await refresh();
    },
    [me, logEvent, refresh]
  );

  const createCertificate = useCallback(
    async (payload) => {
      const created = await base44.entities.Certificate.create(payload);
      await logEvent({
        eventType: "certificate.issued",
        employeeLabel: "Programme administrator",
        employeeEmail: me?.email || "",
        floorCode: payload.floorCode,
        office: payload.office,
        quantity: payload.kgReused,
        quantityUnit: "kg reused",
        status: "Issued",
        actor: me?.name || "Programme administrator",
        entityRef: payload.certId,
        detail: `${payload.type === "office" ? "Office ESG summary" : "Floor"} certificate generated for ${payload.periodLabel}.`,
        auditable: true,
      });
      await refresh();
      return created;
    },
    [me, logEvent, refresh]
  );

  const totalEligible = useMemo(
    () => Object.values(eligibleByFloor).reduce((s, n) => s + Number(n || 0), 0),
    [eligibleByFloor]
  );
  const config = useMemo(() => pledgeConfig(settings, totalEligible), [settings, totalEligible]);

  const placeBid = useCallback(
    async (pct, kind = "opening") => {
      if (!me?.floorCode) throw new Error("Your account has no floor assigned.");
      const value = Math.round(Number(pct));
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error("Enter a whole percentage between 0 and 100.");
      }
      const existing = bidFor(pledges, month, me.floorCode);
      const current = existing ? (existing.finalBid ?? existing.openingBid) : null;
      if (kind === "final" && !existing) throw new Error("Place your opening bid first.");
      if (kind === "final" && value <= current) throw new Error("Bids can only be raised");
      if (kind === "opening" && existing && value === existing.openingBid) {
        throw new Error("That is already your opening bid.");
      }
      if (kind === "final") {
        const open = new Date(config.finalBidOpenAt).getTime();
        const close = new Date(config.finalBidCloseAt).getTime();
        const now = Date.now();
        if (now < open) {
          throw new Error(
            `Final bids open ${formatSgt(config.finalBidOpenAt, false)} at ${clockLabel(config.finalBidOpenAt)}.`
          );
        }
        if (now > close) throw new Error("The final bid window has closed.");
        if (existing.finalBid != null) throw new Error("Your floor has already used its one raise.");
      }

      const entry = { at: new Date().toISOString(), by: `${me.name} · ${me.floorCode} Champion`, pct: value, kind };
      if (!existing) {
        await base44.entities.Pledge.create({
          month,
          floorCode: me.floorCode,
          openingBid: value,
          bids: [entry],
          createdBy: me.name,
        });
      } else {
        await base44.entities.Pledge.update(existing.id, {
          openingBid: kind === "opening" ? value : existing.openingBid,
          finalBid: kind === "final" ? value : existing.finalBid ?? null,
          bids: [...(existing.bids || []), entry],
        });
      }

      await logEvent({
        eventType: "bid.placed",
        employeeLabel: `${me.floorCode} Champion`,
        employeeEmail: me.email,
        floorCode: me.floorCode,
        quantity: value,
        quantityUnit: "% uplift bid",
        status: kind === "final" ? "Final bid" : "Opening bid",
        actor: me.name,
        entityRef: `PLEDGE-${month}-${me.floorCode}`,
        detail: `${kind === "final" ? "Final bid raised" : "Opening bid placed"} at +${value}% uplift for ${month}.`,
        auditable: true,
      });
      await refresh();
      return value;
    },
    [me, pledges, month, config, logEvent, refresh]
  );

  const nudgeFloor = useCallback(async () => {
    const recipients = employees.filter(
      (e) => e.floorCode === me.floorCode && e.email && !myRow?.participants?.toString().includes(e.email)
    );
    const already = (me.lastNudgeAt && Date.now() - new Date(me.lastNudgeAt).getTime() < 7 * 86400000) || false;
    if (already) return { sent: 0, blocked: true };
    await Promise.all(
      recipients.slice(0, 40).map((e) =>
        base44.entities.Notification.create({
          recipientEmail: e.email,
          type: "nudge",
          title: `${me.floorCode} needs you this month`,
          body: `${me.name} (Floor Champion) asks you to collect and report one reuse before the next Ground Drop.`,
          link: "/collect",
          read: false,
          private: true,
          occurredAt: new Date().toISOString(),
        })
      )
    );
    await base44.entities.Employee.update(me.id, { lastNudgeAt: new Date().toISOString() });
    await logEvent({
      eventType: "nudge.sent",
      employeeLabel: me.name,
      employeeEmail: me.email,
      floorCode: me.floorCode,
      quantity: recipients.length,
      quantityUnit: "colleagues",
      status: "Sent",
      actor: me.name,
      detail: `Floor Champion reminder sent to ${recipients.length} colleagues who have not participated this month.`,
    });
    await refresh();
    return { sent: recipients.length };
  }, [employees, me, myRow, logEvent, refresh]);

  const dropsDone = useMemo(() => dropsDoneIn(month, settings), [month, settings]);
  const board = useMemo(
    () => auctionBoard({ month, rows, rowsFor, pledges, config, dropsDone, reuses, settings }),
    [month, rows, rowsFor, pledges, config, dropsDone, reuses, settings]
  );

  const value = {
    loading,
    me,
    employees,
    collections,
    reuses,
    comments,
    pledges,
    board,
    config,
    dropsDone,
    certificates,
    saves,
    notifications: myNotifications,
    unread,
    settings,
    month,
    target,
    rows,
    prevRows,
    allRows,
    office,
    prevOffice,
    myRow,
    myCollections,
    myReuses,
    eligibleByFloor,
    rowsFor,
    loadNotifications,
    markAllRead,
    recordCollection,
    submitReuse,
    reviewReuse,
    addComment,
    toggleReaction,
    saveActivity,
    addProgressUpdate,
    updateMe,
    saveSettings,
    setCertificateStatus,
    createCertificate,
    placeBid,
    nudgeFloor,
    logEvent,
    maskLabel,
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgramme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgramme must be used inside ProgrammeProvider");
  return ctx;
}