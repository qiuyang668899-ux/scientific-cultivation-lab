"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "overview" | "practice" | "hypotheses" | "experiments" | "records" | "map";
type Evidence = "已知" | "桥接" | "前沿";
type LogEntry = {
  id: string;
  date: string;
  protocol: string;
  clarity: number;
  stability: number;
  noise: number;
  note: string;
};
type ExperimentEntry = {
  id: string;
  title: string;
  hypothesis: string;
  trials: number;
  criterion: string;
  status: "已预注册" | "进行中";
  createdAt: string;
};

const nav: { id: View; label: string; short: string }[] = [
  { id: "overview", label: "总控台", short: "总控" },
  { id: "practice", label: "今日修习", short: "修习" },
  { id: "hypotheses", label: "假设库", short: "假设" },
  { id: "experiments", label: "实验台", short: "实验" },
  { id: "records", label: "观察记录", short: "记录" },
  { id: "map", label: "理论图谱", short: "图谱" },
];

const practicePhases = [
  { key: "静", name: "安那般那", minutes: 10, cue: "吸，知道吸；呼，知道呼。只做觉察，不控制呼吸。" },
  { key: "定", name: "一点凝神", minutes: 10, cue: "自然眨眼，注意固定于一点；走神即知，知后即返。" },
  { key: "观", name: "单一观想", minutes: 10, cue: "保持一个白色圆球：位置、大小、亮度始终一致。" },
  { key: "合", name: "意息声形", minutes: 10, cue: "一念、一息、一声、一形，只表达同一个清晰意向。" },
  { key: "发", name: "意向训练", minutes: 15, cue: "保留最简单的结果表征；20 秒聚焦，30 秒完全放松。" },
  { key: "收", name: "退出复位", minutes: 5, cue: "停止观想与目标意向，回到脚、腿、身体与环境声音。" },
];

const hypotheses: { id: string; title: string; evidence: Evidence; statement: string; observable: string; source: string }[] = [
  { id: "H-01", title: "意识控制深度 CCD", evidence: "桥接", statement: "长期内感受与专注训练，可能扩大人对部分自主生理变量的主动调节范围。", observable: "同一任务中，心率、呼吸、皮温或肌张力的可重复调节幅度。", source: "神经控制链 × 内感受训练" },
  { id: "H-02", title: "多尺度相干 MSC", evidence: "桥接", statement: "当意图、呼吸、姿势与肌肉时序趋于同向，行为表现的稳定度可能上升。", observable: "反应时、动作变异、HRV 与主观清晰度的协同变化。", source: "复杂系统 × 人体动力链" },
  { id: "H-03", title: "神经状态触发 NST", evidence: "已知", statement: "固定声音或手势与同一身心状态反复配对，可成为更快进入该状态的触发线索。", observable: "进入目标状态所需时间是否随训练下降。", source: "条件化 × 状态编码" },
  { id: "H-04", title: "意识—物质耦合 CMI", evidence: "前沿", statement: "意识状态是否存在超出声、热、电、磁、机械与生理通道的外部作用，尚待严格检验。", observable: "排除已知干扰后，盲法条件下仍可重复的异常信号。", source: "工作假说 × 可证伪实验" },
  { id: "H-05", title: "意识选择器模型", evidence: "前沿", statement: "若未知效应存在，意识更可能充当边界条件或选择器，而非能量来源。", observable: "不同状态下，随机过程或环境能量通道是否出现剂量—反应关系。", source: "控制论 × 非线性放大" },
  { id: "H-06", title: "支持力状态效应", evidence: "已知", statement: "不同动作、姿态和加速度可让同一人的秤读数改变，但这不等于静质量改变。", observable: "状态与地面反作用力、重心轨迹、动作时序的关系。", source: "经典力学 × 运动控制" },
];

const mapNodes = [
  { key: "微", label: "微观相互作用", level: "物理" },
  { key: "生", label: "分子与细胞", level: "生命" },
  { key: "神", label: "神经网络", level: "控制" },
  { key: "身", label: "身体动力学", level: "行动" },
  { key: "意", label: "意识状态", level: "体验" },
  { key: "验", label: "实验验证", level: "方法" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const formatTime = (seconds: number) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(practicePhases[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [completedDays, setCompletedDays] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [experiments, setExperiments] = useState<ExperimentEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [selectedHypothesis, setSelectedHypothesis] = useState(hypotheses[0]);
  const [evidenceFilter, setEvidenceFilter] = useState<"全部" | Evidence>("全部");
  const [selectedNode, setSelectedNode] = useState(mapNodes[4]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        setLogs(JSON.parse(localStorage.getItem("xiuxian-logs") || "[]"));
        setExperiments(JSON.parse(localStorage.getItem("xiuxian-experiments") || "[]"));
        setCompletedDays(Number(localStorage.getItem("xiuxian-days") || "0"));
      } catch {
        // Keep a clean local state if an old record is malformed.
      }
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("xiuxian-logs", JSON.stringify(logs));
    localStorage.setItem("xiuxian-experiments", JSON.stringify(experiments));
    localStorage.setItem("xiuxian-days", String(completedDays));
  }, [logs, experiments, completedDays, hydrated]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;
        if (phaseIndex < practicePhases.length - 1) {
          const next = phaseIndex + 1;
          setPhaseIndex(next);
          return practicePhases[next].minutes * 60;
        }
        setRunning(false);
        setCompletedDays((days) => days + 1);
        setShowLog(true);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, phaseIndex]);

  const filteredHypotheses = useMemo(
    () => hypotheses.filter((item) => evidenceFilter === "全部" || item.evidence === evidenceFilter),
    [evidenceFilter],
  );

  const currentPhase = practicePhases[phaseIndex];
  const phaseTotal = currentPhase.minutes * 60;
  const progress = Math.max(0, Math.min(100, ((phaseTotal - secondsLeft) / phaseTotal) * 100));
  const today = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).format(new Date());

  function switchView(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function choosePhase(index: number) {
    setRunning(false);
    setPhaseIndex(index);
    setSecondsLeft(practicePhases[index].minutes * 60);
  }

  function skipPhase() {
    const next = Math.min(phaseIndex + 1, practicePhases.length - 1);
    choosePhase(next);
  }

  function saveLog(entry: Omit<LogEntry, "id" | "date">) {
    setLogs((items) => [{ ...entry, id: crypto.randomUUID(), date: new Date().toISOString() }, ...items]);
    setShowLog(false);
  }

  function saveExperiment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entry: ExperimentEntry = {
      id: crypto.randomUUID(),
      title: String(form.get("title") || "未命名实验"),
      hypothesis: String(form.get("hypothesis") || hypotheses[0].id),
      trials: Number(form.get("trials") || 30),
      criterion: String(form.get("criterion") || ""),
      status: "已预注册",
      createdAt: new Date().toISOString(),
    };
    setExperiments((items) => [entry, ...items]);
    event.currentTarget.reset();
  }

  function exportData() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), logs, experiments, completedDays }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `科学修仙实验室_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <aside className="rail">
        <button className="brand" onClick={() => switchView("overview")} aria-label="科学修仙实验室总控台">
          <span className="brand-mark">∞</span>
          <span><b>科学修仙</b><small>实验室 · LAB 01</small></span>
        </button>
        <nav aria-label="主导航">
          {nav.map((item, index) => (
            <button className={view === item.id ? "active" : ""} onClick={() => switchView(item.id)} key={item.id}>
              <span>0{index + 1}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="rail-note">
          <i />
          <p>研究守则</p>
          <span>体验保持开放<br />结论接受验证</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <p><span>TRUEMAN&apos;S WORLD</span> / HUMAN POTENTIAL RESEARCH</p>
          <div className="top-actions">
            <span className="date">{today}</span>
            <span className="status"><i /> 数据仅存本机</span>
          </div>
        </header>

        {view === "overview" && (
          <div className="page overview-page">
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">SCIENCE × CULTIVATION × EVOLUTION</p>
                <h1>以科学为径<br /><em>向未知修行</em></h1>
                <p className="lead">将传说转译为假设，把修习变成实验。<br />不急于相信，也不急于否定。</p>
                <div className="hero-actions">
                  <button onClick={() => switchView("practice")}>开始今日修习 <span>→</span></button>
                  <button className="text-button" onClick={() => switchView("hypotheses")}>进入假设库</button>
                </div>
              </div>
              <div className="poster-stage">
                <div className="poster" role="img" aria-label="科学修仙实验室完整主视觉海报" />
              </div>
            </section>

            <section className="lab-strip" aria-label="今日实验概览">
              <div className="strip-title"><span>DAY {pad(completedDays + 1)}</span><h2>今日实验台</h2></div>
              <div className="protocol"><span>当前协议</span><b>内聚力修习 · 意识信号造波</b><small>静 / 定 / 观 / 合 / 发 / 收</small></div>
              <div className="metric"><span>完整时长</span><b>60<small> MIN</small></b></div>
              <div className="metric"><span>风险等级</span><b className="safe">低</b></div>
              <button className="round" onClick={() => switchView("practice")} aria-label="开始实验">↗</button>
            </section>

            <section className="brand-origin" aria-label="科学修仙研究序言">
              <div className="brush-fragment" role="img" aria-label="科学修仙水墨毛笔题字" />
              <div className="brand-origin-copy">
                <div className="section-kicker"><span>∞</span> 研究序言</div>
                <h2>让真理自由生长<br />让文明持续进化</h2>
                <p>保持开放，不急于相信，也不急于否定。以可重复的修习积累体验，以可证伪的实验校准判断，在未知面前始终保留好奇、理性与敬畏。</p>
                <div className="brand-axis"><span>科学为径</span><i /><span>修行为法</span><i /><span>验证为尺</span></div>
              </div>
            </section>

            <section className="dashboard-grid">
              <article className="ink-card mission-card">
                <div className="section-kicker"><span>01</span> 核心命题</div>
                <blockquote>“人的意识，究竟能够向下控制生命系统多深，又能够向上组织整个身体多大？”</blockquote>
                <p>先训练可重复的意识状态，再测量可观察的变化。每一个箭头，都是一个独立假设。</p>
              </article>
              <article className="ink-card score-card">
                <div className="section-kicker"><span>02</span> 实验进度</div>
                <div className="big-number">{pad(completedDays)}<small> / 100 DAYS</small></div>
                <div className="progress-line"><i style={{ width: `${Math.min(completedDays, 100)}%` }} /></div>
                <p>当前阶段：{completedDays < 30 ? "造意识信号" : completedDays < 60 ? "建立状态按钮" : "意—物训练"}</p>
              </article>
              <article className="ink-card quick-card">
                <div className="section-kicker"><span>03</span> 快速入口</div>
                <button onClick={() => setShowLog(true)}><b>＋</b><span>记录一次观察<small>清晰度 · 稳定度 · 噪声</small></span></button>
                <button onClick={() => switchView("experiments")}><b>↗</b><span>预注册实验<small>先定义，再观察</small></span></button>
              </article>
            </section>

            <section className="principles">
              <p>LABORATORY PRINCIPLES</p>
              <div><b>01</b><span>已知事实</span><small>作为地基</small></div>
              <div><b>02</b><span>跨层假设</span><small>明确标注</small></div>
              <div><b>03</b><span>可证伪实验</span><small>预先定义</small></div>
              <div><b>04</b><span>异常信号</span><small>重复再命名</small></div>
            </section>
          </div>
        )}

        {view === "practice" && (
          <div className="page inner-page practice-page">
            <PageTitle index="02" eyebrow="TODAY'S PRACTICE" title="今日修习" subtitle="静 · 定 · 观 · 合 · 发 · 收" />
            <section className="practice-layout">
              <div className="timer-panel">
                <div className="timer-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
                  <div><span>{currentPhase.key}</span><b>{formatTime(secondsLeft)}</b><small>{currentPhase.name}</small></div>
                </div>
                <p className="phase-cue">{currentPhase.cue}</p>
                <div className="timer-actions">
                  <button className="primary" onClick={() => setRunning((value) => !value)}>{running ? "暂停" : "开始"}</button>
                  <button onClick={skipPhase}>下一阶段</button>
                  <button onClick={() => choosePhase(phaseIndex)}>重置</button>
                </div>
              </div>
              <div className="phase-list">
                <div className="panel-heading"><span>六步协议</span><small>合计 60 分钟</small></div>
                {practicePhases.map((phase, index) => (
                  <button className={phaseIndex === index ? "selected" : ""} onClick={() => choosePhase(index)} key={phase.key}>
                    <b>{phase.key}</b><span>{phase.name}<small>{phase.cue}</small></span><em>{phase.minutes}&apos;</em>
                  </button>
                ))}
              </div>
            </section>
            <section className="safety-note">
              <span>安全边界</span>
              <p>不憋气、不缺氧、不极端禁食、不剥夺睡眠、不制造身体疼痛。出现明显不适、恐慌或现实感异常时立即停止；本工具不是医疗建议。</p>
            </section>
          </div>
        )}

        {view === "hypotheses" && (
          <div className="page inner-page hypotheses-page">
            <PageTitle index="03" eyebrow="HYPOTHESIS REGISTRY" title="假设库" subtitle="把大胆想象写成能够失败的命题" />
            <div className="filter-row" role="group" aria-label="证据等级筛选">
              {(["全部", "已知", "桥接", "前沿"] as const).map((item) => <button className={evidenceFilter === item ? "active" : ""} onClick={() => setEvidenceFilter(item)} key={item}>{item}</button>)}
            </div>
            <section className="hypothesis-grid">
              {filteredHypotheses.map((item) => (
                <button className={`hypothesis-card evidence-${item.evidence}`} onClick={() => setSelectedHypothesis(item)} key={item.id}>
                  <div><span>{item.id}</span><em>{item.evidence}</em></div>
                  <h3>{item.title}</h3>
                  <p>{item.statement}</p>
                  <small>{item.source}</small>
                </button>
              ))}
            </section>
            <section className="hypothesis-detail">
              <div><span>当前选中</span><h2>{selectedHypothesis.title}</h2><p>{selectedHypothesis.statement}</p></div>
              <div><span>必须留下的痕迹</span><p>{selectedHypothesis.observable}</p><button onClick={() => switchView("experiments")}>基于此假设建实验 →</button></div>
            </section>
          </div>
        )}

        {view === "experiments" && (
          <div className="page inner-page experiments-page">
            <PageTitle index="04" eyebrow="EXPERIMENT WORKBENCH" title="实验台" subtitle="先定义成功，再开始观察" />
            <section className="experiment-layout">
              <form className="preregister" onSubmit={saveExperiment}>
                <div className="panel-heading"><span>预注册新实验</span><small>PRE-REGISTRATION</small></div>
                <label>实验名称<input name="title" required placeholder="例：声音锚定进入聚态的速度" /></label>
                <label>关联假设<select name="hypothesis" defaultValue={selectedHypothesis.id}>{hypotheses.map((item) => <option value={item.id} key={item.id}>{item.id} · {item.title}</option>)}</select></label>
                <div className="form-row">
                  <label>计划次数<input name="trials" type="number" min="3" max="1000000" defaultValue="30" /></label>
                  <label>盲法<select name="blind"><option>单盲</option><option>双盲</option><option>暂不适用</option></select></label>
                </div>
                <label>成功标准<textarea name="criterion" required placeholder="实验开始前写清：什么结果算支持，什么结果算不支持？" rows={4} /></label>
                <label className="check"><input type="checkbox" required /><span>我承诺不在看到结果后修改样本量或成功标准。</span></label>
                <button className="primary wide" type="submit">锁定实验方案</button>
              </form>
              <div className="experiment-list">
                <div className="panel-heading"><span>实验档案</span><small>{experiments.length} 项</small></div>
                {experiments.length === 0 ? (
                  <div className="empty-state"><b>⌁</b><p>还没有预注册实验</p><small>左侧写下第一个可失败的预测。</small></div>
                ) : experiments.map((item) => (
                  <article key={item.id}>
                    <div><span>{item.hypothesis}</span><em>{item.status}</em></div>
                    <h3>{item.title}</h3><p>{item.criterion}</p><small>{item.trials} 次 · {new Date(item.createdAt).toLocaleDateString("zh-CN")}</small>
                  </article>
                ))}
              </div>
            </section>
            <section className="control-checks">
              {[
                ["风与呼吸", "密闭、远离出气方向"], ["热对流", "记录温度与等待平衡"], ["机械振动", "独立台面与空白条件"], ["静电/电磁", "屏蔽并记录环境基线"], ["选择性停止", "样本量必须预先固定"], ["期待偏差", "盲化条件与延迟揭盲"],
              ].map(([title, detail], index) => <div key={title}><b>0{index + 1}</b><span>{title}<small>{detail}</small></span></div>)}
            </section>
          </div>
        )}

        {view === "records" && (
          <div className="page inner-page records-page">
            <PageTitle index="05" eyebrow="OBSERVATION LOG" title="观察记录" subtitle="记录体验，但不让体验替代证据" />
            <section className="record-summary">
              <div><span>总记录</span><b>{pad(logs.length)}</b></div>
              <div><span>平均清晰度</span><b>{logs.length ? (logs.reduce((sum, item) => sum + item.clarity, 0) / logs.length).toFixed(1) : "—"}</b></div>
              <div><span>平均稳定度</span><b>{logs.length ? (logs.reduce((sum, item) => sum + item.stability, 0) / logs.length).toFixed(1) : "—"}</b></div>
              <button className="primary" onClick={() => setShowLog(true)}>＋ 新增记录</button>
            </section>
            <section className="logbook">
              <div className="panel-heading"><span>实验日志</span><button onClick={exportData} disabled={!logs.length && !experiments.length}>导出研究数据</button></div>
              {logs.length === 0 ? (
                <div className="empty-state large"><b>○</b><p>第一条观察，等待你来写</p><small>完成修习后，用 60 秒记录状态，不解释、不夸大。</small><button onClick={() => setShowLog(true)}>开始记录</button></div>
              ) : (
                <div className="log-table">
                  {logs.map((log) => (
                    <article key={log.id}>
                      <time>{new Date(log.date).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}</time>
                      <div><h3>{log.protocol}</h3><p>{log.note || "本次未填写文字观察。"}</p></div>
                      <div className="log-metrics"><span>清晰 <b>{log.clarity}</b></span><span>稳定 <b>{log.stability}</b></span><span>噪声 <b>{log.noise}</b></span></div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {view === "map" && (
          <div className="page inner-page map-page">
            <PageTitle index="06" eyebrow="MULTISCALE MAP" title="理论图谱" subtitle="从微观相互作用，到可重复的宏观观察" />
            <section className="map-canvas">
              <div className="map-orbits">
                {mapNodes.map((node, index) => (
                  <button className={`node node-${index} ${selectedNode.key === node.key ? "selected" : ""}`} onClick={() => setSelectedNode(node)} key={node.key}>
                    <b>{node.key}</b><span>{node.label}</span>
                  </button>
                ))}
                <div className="map-core"><span>多尺度</span><b>相干</b><small>COHERENCE</small></div>
              </div>
              <aside className="map-inspector">
                <span>{selectedNode.level}层 / SELECTED</span>
                <h2>{selectedNode.label}</h2>
                <p>{selectedNode.key === "意" ? "把意识视为最高层控制变量：减少命令数量，提高每条命令的系统调用深度。" : selectedNode.key === "验" ? "任何异常先称为信号：重复、换设备、盲化，再寻求第三方复制。" : "这一层不是孤立实体，而是上下层反馈回路中的一个可观察界面。"}</p>
                <div className="scale-chain"><i /> <i /> <i /> <i /> <i /> <i /></div>
              </aside>
            </section>
            <section className="framework-row">
              {["感｜扩大觉察变量", "控｜增加主动变量", "联｜建立因果地图", "聚｜让系统同向", "切｜快速进入状态", "验｜寻找异常信号"].map((item, index) => <div key={item}><b>0{index + 1}</b><span>{item}</span></div>)}
            </section>
          </div>
        )}
      </section>

      <nav className="mobile-nav" aria-label="移动端导航">
        {nav.map((item) => <button className={view === item.id ? "active" : ""} onClick={() => switchView(item.id)} key={item.id}>{item.short}</button>)}
      </nav>

      {showLog && <LogModal phase={currentPhase.name} onClose={() => setShowLog(false)} onSave={saveLog} />}
    </main>
  );
}

function PageTitle({ index, eyebrow, title, subtitle }: { index: string; eyebrow: string; title: string; subtitle: string }) {
  return <header className="page-title"><div><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div><b>{index}</b></header>;
}

function LogModal({ phase, onClose, onSave }: { phase: string; onClose: () => void; onSave: (entry: Omit<LogEntry, "id" | "date">) => void }) {
  const [clarity, setClarity] = useState(5);
  const [stability, setStability] = useState(5);
  const [noise, setNoise] = useState(5);
  const [note, setNote] = useState("");
  return (
    <div className="modal-backdrop">
      <section className="log-modal" role="dialog" aria-modal="true" aria-labelledby="log-title">
        <button className="modal-close" onClick={onClose} aria-label="关闭">×</button>
        <span className="eyebrow">OBSERVATION / 60 SEC</span>
        <h2 id="log-title">记录此刻，不急于解释</h2>
        <p>只写你确实观察到的变化。体验是真实经历，但不自动等于外部能力。</p>
        <div className="range-group">
          <Range label="意识清晰度" value={clarity} setValue={setClarity} />
          <Range label="状态稳定度" value={stability} setValue={setStability} />
          <Range label="心理噪声" value={noise} setValue={setNoise} />
        </div>
        <label>客观描述<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="例：第 7 分钟后呼吸变细，左肩张力下降；未观察到外部物体变化。" /></label>
        <button className="primary wide" onClick={() => onSave({ protocol: phase, clarity, stability, noise, note })}>保存观察</button>
      </section>
    </div>
  );
}

function Range({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return <label><span>{label}<b>{value}</b></span><input type="range" min="1" max="10" value={value} onChange={(event) => setValue(Number(event.target.value))} /></label>;
}
