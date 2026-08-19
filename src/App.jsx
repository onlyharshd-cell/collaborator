import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, NavLink, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowRight, BookOpen, BriefcaseBusiness, Check, ChevronRight, CircleUserRound,
  Compass, GraduationCap, Handshake, Home, LogOut, Menu, MessageCircle,
  Plus, Search, ShieldCheck, Sparkles, Users, X, Zap
} from "lucide-react";
import { api } from "./api";

const categories = [
  ["BOOK", "Books"],
  ["NOTES", "Notes"],
  ["ELECTRONICS", "Electronics"],
  ["HOSTEL", "Hostel"],
  ["OTHER", "Other"]
];

const collaborationTypes = [
  ["PROJECT", "Projects"], ["HACKATHON", "Hackathons"], ["STUDY", "Study"], 
  ["OPEN_SOURCE", "Open Source"], ["STARTUP", "Startups"], ["OTHER", "Other"]
];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then((d) => setUser(d.user)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="screen-center"><div className="loader"></div></div>;

  return (
    <Routes>
      <Route path="/" element={<Landing user={user} />} />
      <Route path="/login" element={<AuthPage mode="login" onAuth={setUser} />} />
      <Route path="/signup" element={<AuthPage mode="signup" onAuth={setUser} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword onAuth={setUser} />} />
      <Route path="/*" element={
        user ? <AppShell user={user} setUser={setUser} /> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

function Landing({ user }) {
  return (
    <div className="landing">
      <header className="public-nav container">
        <Link className="brand" to="/"><span className="brand-mark"><GraduationCap size={20}/></span>StudentHub</Link>
        <div className="nav-actions">
          {user ? <Link className="button primary" to="/dashboard">Open dashboard <ArrowRight size={16}/></Link> :
            <>
              <Link className="button ghost" to="/login">Log in</Link>
              <Link className="button primary" to="/signup">Join StudentHub</Link>
            </>
          }
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15}/> One place for student-to-student value</div>
            <h1>Find what you need.<br/><span>Meet who you need.</span></h1>
            <p className="hero-text">Exchange books and resources, discover teammates, collaborate on projects, share opportunities and build your student network.</p>
            <div className="hero-buttons">
              <Link className="button primary large" to="/signup">Create free account <ArrowRight size={18}/></Link>
              <a className="button glass large" href="#features">Explore features</a>
            </div>
            <div className="trust-row"><ShieldCheck size={16}/> Built around verified accounts, useful profiles and student communities.</div>
          </div>
          <div className="hero-art">
            <div className="orb orb-one"></div><div className="orb orb-two"></div>
            <div className="network-card">
              <div className="mini-top"><span>Student network</span><span className="live-dot">● Live</span></div>
              <div className="profile-stack">
                <div className="profile-bubble p1">AK</div><div className="profile-bubble p2">RM</div><div className="profile-bubble p3">SD</div><div className="profile-bubble p4">+</div>
              </div>
              <div className="match-box"><div><small>Perfect match</small><strong>React + AI project</strong></div><span className="match-score">94%</span></div>
              <div className="fake-lines"><i></i><i></i><i></i></div>
            </div>
          </div>
        </section>

        <section id="features" className="container section">
          <div className="section-heading"><span>Everything students actually need</span><h2>A campus network with a purpose.</h2></div>
          <div className="feature-grid">
            <Feature icon={<BookOpen/>} title="Exchange resources" text="List books, notes, electronics and useful student resources for others to discover." />
            <Feature icon={<Users/>} title="Find teammates" text="Search by skill, course, interests and project type to find people worth building with." />
            <Feature icon={<BriefcaseBusiness/>} title="Discover opportunities" text="Share internships, jobs, hackathons, freelance work and student opportunities." />
            <Feature icon={<MessageCircle/>} title="Connect directly" text="Message another student from their profile and turn a useful match into a real collaboration." />
          </div>
        </section>

        <section className="cta container">
          <div><div className="eyebrow"><Zap size={15}/> Built for student momentum</div><h2>Your next useful connection could be one search away.</h2></div>
          <Link className="button primary large" to="/signup">Start building your network <ArrowRight size={18}/></Link>
        </section>
      </main>
    </div>
  );
}

function Feature({icon, title, text}) {
  return <div className="feature-card"><div className="icon-box">{icon}</div><h3>{title}</h3><p>{text}</p><ChevronRight className="feature-arrow"/></div>;
}

function AuthPage({ mode, onAuth }) {
  const navigate = useNavigate();
  const signup = mode === "signup";
  const [form, setForm] = useState({name:"", email:"", password:"", college:"", course:"", year:""});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const data = signup ? await api.signup(form) : await api.login({email: form.email, password: form.password});
      onAuth(data.user); navigate("/dashboard");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <div className="auth-page">
    <Link className="brand auth-brand" to="/"><span className="brand-mark"><GraduationCap size={20}/></span>StudentHub</Link>
    <div className="auth-layout">
      <div className="auth-side">
        <div className="eyebrow"><Sparkles size={15}/> Student-first network</div>
        <h1>{signup ? "Build your circle. Build your future." : "Welcome back to your student network."}</h1>
        <p>Exchange resources, find collaborators and discover opportunities without the noise.</p>
        <div className="auth-points"><div><Check/> Real student profiles</div><div><Check/> Collaboration discovery</div><div><Check/> Resource exchange</div></div>
      </div>
      <div className="auth-card">
        <div className="auth-card-head"><span className="pill">{signup ? "Create account" : "Welcome back"}</span><h2>{signup ? "Join StudentHub" : "Log in"}</h2><p>{signup ? "Create your profile in under a minute." : "Continue where you left off."}</p></div>
        <form onSubmit={submit} className="form">
          {signup && <label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
          <label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
          <label>Password<input type="password" required minLength="8" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>
          {signup && <div className="two-col">
            <label>College<input value={form.college} onChange={e=>setForm({...form,college:e.target.value})} placeholder="Your college"/></label>
            <label>Year<input value={form.year} onChange={e=>setForm({...form,year:e.target.value})} placeholder="e.g. 2nd year"/></label>
          </div>}
          {signup && <label>Course<input value={form.course} onChange={e=>setForm({...form,course:e.target.value})} placeholder="e.g. B.Tech CSE"/></label>}
          {error && <div className="error-box">{error}</div>}
          <button className="button primary full" disabled={busy}>{busy ? "Please wait..." : signup ? "Create my account" : "Log in"} <ArrowRight size={17}/></button>
        </form>
        {!signup && <Link className="forgot-link" to="/forgot-password">Forgot your password?</Link>}
        <div className="auth-switch">{signup ? "Already have an account?" : "New to StudentHub?"} <Link to={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create an account"}</Link></div>
      </div>
    </div>
  </div>;
}

function ForgotPassword() {
  const [email,setEmail] = useState(""); const [sent,setSent] = useState(false); const [error,setError] = useState("");
  async function submit(e){e.preventDefault();setError("");try{await api.forgot(email);setSent(true)}catch(err){setError(err.message)}}
  return <div className="auth-page"><Link className="brand auth-brand" to="/"><span className="brand-mark"><GraduationCap size={20}/></span>StudentHub</Link>
    <div className="single-auth"><div className="auth-card">
      <div className="auth-card-head"><span className="pill">Account recovery</span><h2>Reset your password</h2><p>Enter your account email and we'll send reset instructions.</p></div>
      {sent ? <div className="success-box"><Check size={20}/><div><strong>Check your inbox</strong><p>If that email belongs to an account, reset instructions have been sent.</p></div></div> :
      <form onSubmit={submit} className="form"><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>{error&&<div className="error-box">{error}</div>}<button className="button primary full">Send reset link <ArrowRight size={17}/></button></form>}
      <Link className="back-link" to="/login">← Back to login</Link>
    </div></div>
  </div>
}

function ResetPassword({onAuth}) {
  const [params] = useSearchParams(); const token=params.get("token")||"";
  const [password,setPassword]=useState(""); const [done,setDone]=useState(false); const [error,setError]=useState(""); const navigate=useNavigate();
  async function submit(e){e.preventDefault();setError("");try{const d=await api.reset({token,password});onAuth(d.user);setDone(true);setTimeout(()=>navigate("/dashboard"),700)}catch(err){setError(err.message)}}
  return <div className="auth-page"><Link className="brand auth-brand" to="/"><span className="brand-mark"><GraduationCap size={20}/></span>StudentHub</Link><div className="single-auth"><div className="auth-card">
    <div className="auth-card-head"><span className="pill">New password</span><h2>Choose a new password</h2><p>Your reset link is valid for 30 minutes.</p></div>
    <form onSubmit={submit} className="form"><label>New password<input type="password" minLength="8" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>{error&&<div className="error-box">{error}</div>}{done&&<div className="success-box"><Check/> Password updated.</div>}<button className="button primary full">Update password <ArrowRight size={17}/></button></form>
  </div></div></div>
}

function AppShell({user,setUser}) {
  const [open,setOpen]=useState(false); const navigate=useNavigate(); const location=useLocation();
  async function logout(){await api.logout();setUser(null);navigate("/");}
  const links = [
    ["/dashboard","Dashboard",Home], ["/exchange","Exchange",BookOpen], ["/collaborate","Collaborate",Handshake],
    ["/opportunities","Opportunities",BriefcaseBusiness], ["/students","Students",Users], ["/messages","Messages",MessageCircle]
  ];
  return <div className="app-shell">
    <aside className={`sidebar ${open?"open":""}`}>
      <div className="sidebar-top"><Link className="brand" to="/dashboard"><span className="brand-mark"><GraduationCap size={20}/></span>StudentHub</Link><button className="mobile-close" onClick={()=>setOpen(false)}><X/></button></div>
      <nav>{links.map(([to,label,Icon])=><NavLink key={to} to={to} onClick={()=>setOpen(false)} className={({isActive})=>isActive?"active":""}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom">
        <Link to="/profile" className="mini-user"><Avatar name={user.name}/><span><strong>{user.name}</strong><small>{user.course||"Student"}</small></span></Link>
        <button className="logout" onClick={logout}><LogOut size={17}/> Log out</button>
      </div>
    </aside>
    {open&&<div className="overlay" onClick={()=>setOpen(false)}></div>}
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setOpen(true)}><Menu/></button><div><small className="top-kicker">Student network</small><h3>{links.find(x=>location.pathname.startsWith(x[0]))?.[1] || "StudentHub"}</h3></div><Link to="/profile" className="top-profile"><Avatar name={user.name}/></Link></header>
      <div className="content"><Routes>
        <Route path="/dashboard" element={<Dashboard user={user}/>}/>
        <Route path="/exchange" element={<Exchange user={user}/>}/>
        <Route path="/collaborate" element={<Collaborate user={user}/>}/>
        <Route path="/opportunities" element={<Opportunities user={user}/>}/>
        <Route path="/students" element={<Students user={user}/>}/>
        <Route path="/messages" element={<Messages user={user}/>}/>
        <Route path="/messages/:userId" element={<Messages user={user}/>}/>
        <Route path="/profile" element={<Profile user={user} setUser={setUser}/>}/>
        <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
      </Routes></div>
    </main>
  </div>
}

function Avatar({name}) {
  const initials = name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
  return <div className="avatar">{initials}</div>;
}

function Dashboard({user}) {
  const [stats,setStats]=useState(null); const [listings,setListings]=useState([]); const [collabs,setCollabs]=useState([]); const [jobs,setJobs]=useState([]);
  useEffect(()=>{Promise.all([api.dashboard(),api.listings(),api.collaborations(),api.jobs()]).then(([s,l,c,j])=>{setStats(s.stats);setListings(l.listings.slice(0,3));setCollabs(c.collaborations.slice(0,3));setJobs(j.jobs.slice(0,3))})},[]);
  return <div>
    <div className="welcome"><div><span className="eyebrow"><Sparkles size={14}/> Your student network</span><h1>Hey {user.name.split(" ")[0]}, what's next?</h1><p>Exchange something useful, meet a collaborator, or discover your next opportunity.</p></div><Link className="button primary" to="/collaborate"><Plus size={17}/> Post something</Link></div>
    <div className="stats-grid">{[["Students",stats?.students??"-",Users],["My listings",stats?.listings??"-",BookOpen],["My collaborations",stats?.collaborations??"-",Handshake],["My opportunities",stats?.jobs??"-",BriefcaseBusiness]].map(([label,val,Icon])=><div className="stat-card" key={label}><div className="stat-icon"><Icon/></div><div><strong>{val}</strong><span>{label}</span></div></div>)}</div>
    <div className="dashboard-grid">
      <section className="panel"><PanelHead title="Fresh exchanges" link="/exchange"/>{listings.map(x=><ListingRow key={x.id} item={x}/>)}</section>
      <section className="panel"><PanelHead title="People building things" link="/collaborate"/>{collabs.map(x=><CollabRow key={x.id} item={x}/>)}</section>
    </div>
    <section className="panel"><PanelHead title="Latest opportunities" link="/opportunities"/><div className="job-grid">{jobs.map(x=><JobCard key={x.id} item={x}/>)}</div></section>
  </div>
}

function PanelHead({title,link}){return <div className="panel-head"><h2>{title}</h2><Link to={link}>View all <ArrowRight size={15}/></Link></div>}

function ListingRow({item}){return <div className="row-card"><div className="row-icon"><BookOpen/></div><div className="row-main"><strong>{item.title}</strong><span>{item.type} · {item.location||"Student campus"}</span></div><div className="row-price">{item.price?`₹${item.price}`:"Free"}</div></div>}
function CollabRow({item}){return <div className="row-card"><Avatar name={item.owner.name}/><div className="row-main"><strong>{item.title}</strong><span>{item.type} · {item.skills.slice(0,3).join(" · ")||"Open to collaborators"}</span></div><Link className="small-action" to={`/messages/${item.owner.id}`}>Connect</Link></div>}
function JobCard({item}){return <div className="job-card"><div className="company-icon">{item.company.slice(0,1).toUpperCase()}</div><div><span>{item.company}</span><strong>{item.title}</strong><small>{item.location||"Remote"} · {item.skills.slice(0,3).join(", ")}</small></div><a href={item.applyUrl||"#"} target="_blank" rel="noreferrer"><ArrowRight/></a></div>}

function SearchBar({value,onChange,placeholder="Search..."}){return <div className="searchbar"><Search size={18}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>}

function Exchange({user}) {
  const [q,setQ]=useState(""); const [type,setType]=useState(""); const [items,setItems]=useState([]); const [show,setShow]=useState(false); const [error,setError]=useState("");
  async function load(){try{setItems((await api.listings(q,type)).listings)}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[q,type]);
  async function create(data){try{await api.createListing(data);setShow(false);load()}catch(e){setError(e.message)}}
  return <Page title="Exchange" subtitle="Give a useful resource a second life.">
    <div className="toolbar"><SearchBar value={q} onChange={setQ} placeholder="Search books, notes, electronics..."/><select value={type} onChange={e=>setType(e.target.value)}><option value="">All categories</option>{categories.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select><button className="button primary" onClick={()=>setShow(true)}><Plus size={17}/> Add listing</button></div>
    {error&&<div className="error-box">{error}</div>}
    <div className="card-grid">{items.map(x=><ListingCard key={x.id} item={x} currentUser={user} onDelete={async()=>{await api.deleteListing(x.id);load()}}/>)}</div>
    {!items.length&&<Empty icon={<BookOpen/>} title="No listings yet" text="Be the first student to share something useful."/>}
    {show&&<Modal title="Create an exchange listing" onClose={()=>setShow(false)}><ListingForm onSubmit={create}/></Modal>}
  </Page>
}

function ListingCard({item,currentUser,onDelete}){return <article className="market-card"><div className="market-cover">{item.type==="BOOK"?"BOOK":item.type==="NOTES"?"NOTES":"SHARE"}</div><div className="market-body"><div className="card-meta"><span>{item.type}</span><b>{item.price?`₹${item.price}`:"FREE"}</b></div><h3>{item.title}</h3><p>{item.description}</p><div className="card-footer"><div className="person"><Avatar name={item.owner.name}/><span>{item.owner.name}<small>{item.location||"Campus"}</small></span></div>{item.owner.id===currentUser.id?<button className="icon-button danger" onClick={onDelete}><X size={16}/></button>:<Link className="button mini" to={`/messages/${item.owner.id}`}>Message</Link>}</div></div></article>}

function ListingForm({onSubmit}){const [f,setF]=useState({title:"",description:"",type:"BOOK",price:null,location:""});return <form className="form" onSubmit={e=>{e.preventDefault();onSubmit({...f,price:f.price===""?null:Number(f.price)})}}><label>Title<input required value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></label><label>Description<textarea required rows="4" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></label><div className="two-col"><label>Category<select value={f.type} onChange={e=>setF({...f,type:e.target.value})}>{categories.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label><label>Price<input type="number" min="0" value={f.price??""} onChange={e=>setF({...f,price:e.target.value})} placeholder="Leave blank for free"/></label></div><label>Location<input value={f.location} onChange={e=>setF({...f,location:e.target.value})} placeholder="Campus / city"/></label><button className="button primary full">Publish listing <ArrowRight size={17}/></button></form>}

function Collaborate({user}){const [q,setQ]=useState("");const[type,setType]=useState("");const[items,setItems]=useState([]);const[show,setShow]=useState(false);const[error,setError]=useState("");async function load(){try{setItems((await api.collaborations(q,type)).collaborations)}catch(e){setError(e.message)}}useEffect(()=>{load()},[q,type]);return <Page title="Collaborate" subtitle="Find people who want to build, learn and ship together."><div className="toolbar"><SearchBar value={q} onChange={setQ} placeholder="Search projects or skills..."/><select value={type} onChange={e=>setType(e.target.value)}><option value="">All types</option>{collaborationTypes.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select><button className="button primary" onClick={()=>setShow(true)}><Plus size={17}/> Find teammates</button></div>{error&&<div className="error-box">{error}</div>}<div className="collab-grid">{items.map(x=><CollabCard key={x.id} item={x} currentUser={user} onDelete={async()=>{await api.deleteCollaboration(x.id);load()}}/>)}</div>{!items.length&&<Empty icon={<Handshake/>} title="No collaboration posts" text="Post what you're building and find the missing skill."/>}{show&&<Modal title="Create collaboration post" onClose={()=>setShow(false)}><CollabForm onSubmit={async data=>{try{await api.createCollaboration(data);setShow(false);load()}catch(e){setError(e.message)}}}/></Modal>}</Page>}

function CollabCard({item,currentUser,onDelete}){return <article className="collab-card"><div className="collab-head"><span className="pill">{item.type.replace("_"," ")}</span>{item.remote&&<span className="remote">Remote friendly</span>}</div><h3>{item.title}</h3><p>{item.description}</p><div className="tags">{item.skills.map(s=><span key={s}>#{s}</span>)}</div><div className="collab-footer"><div className="person"><Avatar name={item.owner.name}/><span><strong>{item.owner.name}</strong><small>{item.owner.course||"Student"} · {item.location||"Anywhere"}</small></span></div>{item.owner.id===currentUser.id?<button className="icon-button danger" onClick={onDelete}><X size={16}/></button>:<Link className="button mini" to={`/messages/${item.owner.id}`}>Let's talk</Link>}</div></article>}

function CollabForm({onSubmit}){const[f,setF]=useState({title:"",description:"",type:"PROJECT",skills:[],location:"",remote:true});const[skill,setSkill]=useState("");return <form className="form" onSubmit={e=>{e.preventDefault();onSubmit(f)}}><label>What are you building?<input required value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="AI study planner"/></label><label>Describe the opportunity<textarea required rows="4" value={f.description} onChange={e=>setF({...f,description:e.target.value})} placeholder="Who are you looking for and what will you build?"/></label><div className="two-col"><label>Type<select value={f.type} onChange={e=>setF({...f,type:e.target.value})}>{collaborationTypes.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label><label>Location<input value={f.location} onChange={e=>setF({...f,location:e.target.value})}/></label></div><label>Skills needed<div className="skill-input"><input value={skill} onChange={e=>setSkill(e.target.value)} placeholder="React"/><button type="button" className="button ghost" onClick={()=>{if(skill.trim())setF({...f,skills:[...f.skills,skill.trim()]});setSkill("")}}>Add</button></div></label><div className="tags">{f.skills.map(s=><span key={s}>#{s}</span>)}</div><button className="button primary full">Publish collaboration <ArrowRight size={17}/></button></form>}

function Opportunities({user}){const[q,setQ]=useState("");const[items,setItems]=useState([]);const[show,setShow]=useState(false);const[error,setError]=useState("");async function load(){try{setItems((await api.jobs(q)).jobs)}catch(e){setError(e.message)}}useEffect(()=>{load()},[q]);return <Page title="Opportunities" subtitle="Internships, jobs, freelance work and useful leads shared by students."><div className="toolbar"><SearchBar value={q} onChange={setQ} placeholder="Search role, company or skill..."/><button className="button primary" onClick={()=>setShow(true)}><Plus size={17}/> Share opportunity</button></div>{error&&<div className="error-box">{error}</div>}<div className="job-list">{items.map(x=><JobCardFull key={x.id} item={x} currentUser={user} onDelete={async()=>{await api.deleteJob(x.id);load()}}/>)}</div>{!items.length&&<Empty icon={<BriefcaseBusiness/>} title="No opportunities yet" text="Share the first useful lead with your campus."/>}{show&&<Modal title="Share an opportunity" onClose={()=>setShow(false)}><JobForm onSubmit={async data=>{try{await api.createJob(data);setShow(false);load()}catch(e){setError(e.message)}}}/></Modal>}</Page>}

function JobCardFull({item,currentUser,onDelete}){return <article className="job-full"><div className="company-icon big">{item.company.slice(0,1).toUpperCase()}</div><div className="job-info"><div className="card-meta"><span>{item.location||"Remote"}</span><span>{new Date(item.createdAt).toLocaleDateString()}</span></div><h3>{item.title}</h3><strong>{item.company}</strong><p>{item.description}</p><div className="tags">{item.skills.map(s=><span key={s}>#{s}</span>)}</div></div><div>{item.applyUrl&&<a className="button primary" href={item.applyUrl} target="_blank" rel="noreferrer">Apply <ArrowRight size={16}/></a>}{item.postedBy.id===currentUser.id&&<button className="text-danger" onClick={onDelete}>Delete</button>}</div></article>}

function JobForm({onSubmit}){const[f,setF]=useState({title:"",company:"",description:"",skills:[],location:"",applyUrl:""});const[skill,setSkill]=useState("");return <form className="form" onSubmit={e=>{e.preventDefault();onSubmit(f)}}><label>Role<input required value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></label><label>Company<input required value={f.company} onChange={e=>setF({...f,company:e.target.value})}/></label><label>Description<textarea required rows="4" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></label><div className="two-col"><label>Location<input value={f.location} onChange={e=>setF({...f,location:e.target.value})}/></label><label>Apply URL<input type="url" value={f.applyUrl} onChange={e=>setF({...f,applyUrl:e.target.value})} placeholder="https://..."/></label></div><label>Skills<div className="skill-input"><input value={skill} onChange={e=>setSkill(e.target.value)}/><button type="button" className="button ghost" onClick={()=>{if(skill.trim())setF({...f,skills:[...f.skills,skill.trim()]});setSkill("")}}>Add</button></div></label><div className="tags">{f.skills.map(s=><span key={s}>#{s}</span>)}</div><button className="button primary full">Publish opportunity <ArrowRight size={17}/></button></form>}

function Students({user}){const[q,setQ]=useState("");const[items,setItems]=useState([]);useEffect(()=>{api.users(q).then(d=>setItems(d.users)).catch(()=>{})},[q]);return <Page title="Students" subtitle="Search the network by name, college, course or skill."><SearchBar value={q} onChange={setQ} placeholder="Try React, Python, CSE, your college..."/><div className="student-grid">{items.map(x=><article className="student-card" key={x.id}><Avatar name={x.name}/><h3>{x.name}</h3><span>{x.course||"Student"}{x.year?` · ${x.year}`:""}</span><small>{x.college||"College not added"}</small><p>{x.bio||"Open to connecting and collaborating."}</p><div className="tags">{x.skills.slice(0,5).map(s=><span key={s}>#{s}</span>)}</div><Link className="button primary full" to={`/messages/${x.id}`}>Message <MessageCircle size={16}/></Link></article>)}</div>{!items.length&&<Empty icon={<Users/>} title="No students found" text="Try a different search."/>}</Page>}

function Messages({user}){const navigate=useNavigate();const {pathname}=useLocation();const targetId=pathname.split("/")[2];const[students,setStudents]=useState([]);const[selected,setSelected]=useState(targetId||"");const[messages,setMessages]=useState([]);const[text,setText]=useState("");useEffect(()=>{api.users().then(d=>setStudents(d.users))},[]);useEffect(()=>{if(targetId)setSelected(targetId)},[targetId]);useEffect(()=>{if(selected)api.messages(selected).then(d=>setMessages(d.messages))},[selected]);const target=students.find(x=>x.id===selected);async function send(e){e.preventDefault();if(!text.trim())return;const d=await api.sendMessage(selected,text);setMessages([...messages,d.message]);setText("")}return <Page title="Messages" subtitle="Connect directly with another student."><div className="message-layout"><div className="conversation-list"><div className="conv-head">Students</div>{students.map(s=><button key={s.id} className={`conversation ${s.id===selected?"selected":""}`} onClick={()=>{setSelected(s.id);navigate(`/messages/${s.id}`)}}><Avatar name={s.name}/><span><strong>{s.name}</strong><small>{s.course||"Student"}</small></span></button>)}</div><div className="chat"><div className="chat-head">{target?<><Avatar name={target.name}/><div><strong>{target.name}</strong><span>{target.college||"Student network"}</span></div></>:<div>Select a student to start</div>}</div><div className="chat-body">{selected?messages.map(m=><div key={m.id} className={`bubble ${m.senderId===user.id?"mine":""}`}>{m.content}<small>{new Date(m.createdAt).toLocaleString()}</small></div>):<Empty icon={<MessageCircle/>} title="Your inbox is quiet" text="Pick a student from the left to start a conversation."/>}</div>{selected&&<form className="chat-input" onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Write a message..."/><button className="button primary"><ArrowRight/></button></form>}</div></div></Page>}

function Profile({user,setUser}){const[f,setF]=useState({name:user.name,college:user.college||"",course:user.course||"",year:user.year||"",bio:user.bio||"",skills:user.skills||[]});const[skill,setSkill]=useState("");const[saved,setSaved]=useState(false);async function save(e){e.preventDefault();const d=await api.updateProfile(f);setUser(d.user);setSaved(true);setTimeout(()=>setSaved(false),1800)}return <Page title="Your profile" subtitle="Make it easy for the right people to find you."><div className="profile-layout"><div className="profile-preview"><div className="avatar huge">{f.name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div><h2>{f.name}</h2><p>{f.course||"Student"} {f.year&&`· ${f.year}`}</p><span>{f.college||"Add your college"}</span><div className="tags">{f.skills.map(s=><span key={s}>#{s}</span>)}</div></div><form className="panel form" onSubmit={save}><div className="panel-head"><h2>Edit profile</h2>{saved&&<span className="saved"><Check size={15}/> Saved</span>}</div><div className="two-col"><label>Name<input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label><label>Email<input value={user.email} disabled/></label></div><div className="two-col"><label>College<input value={f.college} onChange={e=>setF({...f,college:e.target.value})}/></label><label>Year<input value={f.year} onChange={e=>setF({...f,year:e.target.value})}/></label></div><label>Course<input value={f.course} onChange={e=>setF({...f,course:e.target.value})}/></label><label>Bio<textarea rows="5" value={f.bio} onChange={e=>setF({...f,bio:e.target.value})} placeholder="What do you like building or learning?"/></label><label>Skills<div className="skill-input"><input value={skill} onChange={e=>setSkill(e.target.value)} placeholder="JavaScript"/><button type="button" className="button ghost" onClick={()=>{if(skill.trim())setF({...f,skills:[...f.skills,skill.trim()]});setSkill("")}}>Add</button></div></label><div className="tags">{f.skills.map(s=><span key={s}>#{s}</span>)}</div><button className="button primary">Save profile <Check size={17}/></button></form></div></Page>}

function Page({title,subtitle,children}){return <div className="page"><div className="page-heading"><div><span className="eyebrow"><Compass size={14}/> Explore</span><h1>{title}</h1><p>{subtitle}</p></div></div>{children}</div>}
function Empty({icon,title,text}){return <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>}
function Modal({title,onClose,children}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X/></button></div>{children}</div></div>}

export default App;
