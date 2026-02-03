import { useEffect, useMemo, useState } from "react";
import html2pdf from "html2pdf.js";
import styles from "./App.module.css";

const STORAGE_KEY = "resume.gen.data.v1";
const PRO_KEY = "resume.gen.pro.v1";
const TEMPLATE_KEY = "resume.gen.template.v1";

const defaultData = {
  name: "Jordan Blake",
  title: "Frontend Engineer",
  summary:
    "Frontend engineer focused on fast, accessible interfaces and design systems that scale across teams.",
  skills: "React, TypeScript, CSS, Design Systems, Accessibility, Performance",
  experience: [
    {
      role: "Senior Frontend Engineer",
      company: "Northwind Labs",
      start: "2022",
      end: "Present",
      details:
        "Led the UI architecture for a multi-tenant dashboard; reduced bundle size by 32%; built reusable components with Storybook."
    },
    {
      role: "Frontend Engineer",
      company: "Sable Studios",
      start: "2019",
      end: "2022",
      details:
        "Collaborated with product and design to ship weekly releases; improved Core Web Vitals to 95+; mentored 3 interns."
    }
  ],
  projects: [
    {
      name: "Nimbus Portfolio",
      description:
        "One-page portfolio generator with theme presets, CMS-free editing, and responsive layouts.",
      link: "https://example.com"
    }
  ],
  education: [
    {
      school: "University of Cascadia",
      degree: "B.S. in Computer Science",
      start: "2015",
      end: "2019",
      details: "Human-computer interaction focus, Dean's list."
    }
  ],
  contacts: {
    email: "hello@jordanblake.dev",
    phone: "+1 (555) 222-8899",
    location: "Seattle, WA",
    website: "jordanblake.dev",
    linkedin: "linkedin.com/in/jordanblake",
    github: "github.com/jordanblake"
  }
};

const roleSkillMap = {
  frontend: [
    "React",
    "TypeScript",
    "Next.js",
    "CSS Grid",
    "Accessibility",
    "Performance",
    "Testing Library",
    "Design Systems"
  ],
  backend: ["Node.js", "APIs", "PostgreSQL", "Redis", "Docker", "CI/CD", "Security"],
  designer: [
    "Figma",
    "Design Systems",
    "Prototyping",
    "User Research",
    "Wireframing",
    "Visual Design"
  ],
  data: [
    "Python",
    "SQL",
    "Statistics",
    "Pandas",
    "Machine Learning",
    "Data Visualization"
  ],
  product: [
    "Product Strategy",
    "Roadmapping",
    "Stakeholder Management",
    "Experimentation",
    "Analytics"
  ]
};

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "your",
  "you",
  "our",
  "are",
  "will",
  "a",
  "an",
  "to",
  "in",
  "of",
  "on",
  "as",
  "is",
  "be",
  "by",
  "or",
  "at",
  "we",
  "it",
  "their",
  "they",
  "us",
  "about",
  "role"
]);

const emptyExperience = {
  role: "",
  company: "",
  start: "",
  end: "",
  details: ""
};

const emptyProject = {
  name: "",
  description: "",
  link: ""
};

const emptyEducation = {
  school: "",
  degree: "",
  start: "",
  end: "",
  details: ""
};
function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeSkills(skillText) {
  if (!skillText) return [];
  return skillText
    .split(/,|\n/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function improveSentence(text) {
  if (!text) return "";
  let updated = text.trim();

  const replacements = [
    [/\bI am\b/gi, "I am a"],
    [/\bI was responsible for\b/gi, "Led"],
    [/\bresponsible for\b/gi, "owned"],
    [/\bworked on\b/gi, "delivered"],
    [/\bhelped\b/gi, "accelerated"],
    [/\bvery\b/gi, "highly"],
    [/\butilize\b/gi, "use"],
    [/\bteam player\b/gi, "collaborative"],
    [/\bresults\b/gi, "outcomes"]
  ];

  replacements.forEach(([pattern, replacement]) => {
    updated = updated.replace(pattern, replacement);
  });

  updated = updated.replace(/\s+/g, " ");
  updated = updated.charAt(0).toUpperCase() + updated.slice(1);
  if (!/[.!?]$/.test(updated)) {
    updated += ".";
  }
  return updated;
}

function extractKeywords(text) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .match(/[a-z][a-z+#.]{2,}/g);
  if (!words) return [];

  const counts = words.reduce((acc, word) => {
    if (stopWords.has(word)) return acc;
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function generateAbout(data) {
  const skills = normalizeSkills(data.skills).slice(0, 5).join(", ");
  const summary = data.summary || "Building thoughtful digital experiences.";
  return `${data.name || "This creator"} is a ${data.title || "multidisciplinary professional"} who ${summary
    .replace(/\.$/, "")
    .toLowerCase()}. Skilled in ${skills || "craft, collaboration, and delivery"}, they focus on shipping products that feel effortless to use.`;
}
function App() {
  const [data, setData] = useState(defaultData);
  const [template, setTemplate] = useState("modern");
  const [view, setView] = useState("resume");
  const [proUnlocked, setProUnlocked] = useState(false);
  const [sentenceInput, setSentenceInput] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [aboutDraft, setAboutDraft] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setData(safeParse(stored, defaultData));
    }
    const storedPro = localStorage.getItem(PRO_KEY);
    setProUnlocked(storedPro === "true");
    const storedTemplate = localStorage.getItem(TEMPLATE_KEY);
    if (storedTemplate) setTemplate(storedTemplate);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(PRO_KEY, String(proUnlocked));
  }, [proUnlocked]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_KEY, template);
  }, [template]);

  const skillsArray = useMemo(() => normalizeSkills(data.skills), [data.skills]);

  const suggestedSkills = useMemo(() => {
    const role = data.title.toLowerCase();
    if (role.includes("front")) return roleSkillMap.frontend;
    if (role.includes("back")) return roleSkillMap.backend;
    if (role.includes("design")) return roleSkillMap.designer;
    if (role.includes("data")) return roleSkillMap.data;
    if (role.includes("product")) return roleSkillMap.product;
    return roleSkillMap.frontend;
  }, [data.title]);

  const filteredSuggestions = suggestedSkills.filter(
    (skill) => !skillsArray.map((item) => item.toLowerCase()).includes(skill.toLowerCase())
  );

  const strengthScore = useMemo(() => {
    let score = 0;
    if (data.name) score += 8;
    if (data.title) score += 8;
    if (data.summary) score += 14;
    score += Math.min(12, skillsArray.length * 2);
    score += Math.min(24, data.experience.length * 6);
    score += Math.min(14, data.projects.length * 4);
    score += Math.min(10, data.education.length * 5);
    score += Math.min(10, Object.values(data.contacts).filter(Boolean).length * 2);
    return Math.min(100, score);
  }, [data, skillsArray]);

  const keywordList = useMemo(() => extractKeywords(jobDescription), [jobDescription]);

  const improvedSentence = useMemo(() => improveSentence(sentenceInput), [sentenceInput]);

  const handleChange = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (field, value) => {
    setData((prev) => ({
      ...prev,
      contacts: { ...prev.contacts, [field]: value }
    }));
  };

  const updateArrayItem = (key, index, field, value) => {
    setData((prev) => {
      const updated = prev[key].map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );
      return { ...prev, [key]: updated };
    });
  };

  const addArrayItem = (key, emptyItem) => {
    setData((prev) => ({ ...prev, [key]: [...prev[key], { ...emptyItem }] }));
  };

  const removeArrayItem = (key, index) => {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, idx) => idx !== index)
    }));
  };

  const addSkill = (skill) => {
    setData((prev) => {
      const current = normalizeSkills(prev.skills);
      const exists = current.some((item) => item.toLowerCase() === skill.toLowerCase());
      if (exists) return prev;
      return { ...prev, skills: [...current, skill].join(", ") };
    });
  };

  const exportPDF = () => {
    const element = document.getElementById("resume-preview");
    if (!element) return;

    const filename = `${data.name || "resume"}-resume.pdf`;
    html2pdf()
      .set({
        margin: [0.35, 0.35],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      })
      .from(element)
      .save();
  };

  const initials = data.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={styles.app}>
      <header className={`${styles.header} noPrint`}>
        <div>
          <p className={styles.kicker}>Resume + Portfolio Generator</p>
          <h1>Design-ready resumes, ATS-ready layouts, and a portfolio in one place.</h1>
          <p className={styles.subhead}>
            Edit once, export everywhere.{" "}
            <span className={styles.privacy}>Your resume never leaves your browser.</span>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={view === "resume" ? styles.primaryBtn : styles.ghostBtn}
            onClick={() => setView("resume")}
          >
            Resume Builder
          </button>
          <button
            className={view === "portfolio" ? styles.primaryBtn : styles.ghostBtn}
            onClick={() => setView("portfolio")}
          >
            Portfolio Site
          </button>
          <button
            className={proUnlocked ? styles.successBtn : styles.primaryBtn}
            onClick={() => setProUnlocked(true)}
          >
            {proUnlocked ? "Pro Unlocked" : "Unlock Pro"}
          </button>
        </div>
      </header>

      <main className={styles.content}>
        <section className={`${styles.builder} noPrint`}>
          <div className={styles.sectionHeader}>
            <h2>Resume Builder</h2>
            <p>Auto-saved locally. Instant preview on the right.</p>
          </div>

          <div className={styles.card}>
            <h3>Basics</h3>
            <div className={styles.gridTwo}>
              <label>
                Name
                <input
                  value={data.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label>
                Role / Title
                <input
                  value={data.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                  placeholder="Frontend Engineer"
                />
              </label>
            </div>
            <label>
              Summary
              <textarea
                rows="3"
                value={data.summary}
                onChange={(event) => handleChange("summary", event.target.value)}
                placeholder="Write a concise summary"
              />
            </label>
          </div>

          <div className={styles.card}>
            <h3>Skills</h3>
            <label>
              Skills (comma or line separated)
              <textarea
                rows="2"
                value={data.skills}
                onChange={(event) => handleChange("skills", event.target.value)}
              />
            </label>
            <div className={styles.suggestions}>
              <span>Suggested for {data.title || "your role"}:</span>
              <div className={styles.pillRow}>
                {filteredSuggestions.slice(0, 8).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className={styles.pill}
                    onClick={() => addSkill(skill)}
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h3>Experience</h3>
              <button
                className={styles.ghostBtn}
                type="button"
                onClick={() => addArrayItem("experience", emptyExperience)}
              >
                Add Experience
              </button>
            </div>
            {data.experience.map((item, index) => (
              <div key={`exp-${index}`} className={styles.repeatCard}>
                <div className={styles.gridTwo}>
                  <label>
                    Role
                    <input
                      value={item.role}
                      onChange={(event) =>
                        updateArrayItem("experience", index, "role", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Company
                    <input
                      value={item.company}
                      onChange={(event) =>
                        updateArrayItem("experience", index, "company", event.target.value)
                      }
                    />
                  </label>
                </div>
                <div className={styles.gridTwo}>
                  <label>
                    Start
                    <input
                      value={item.start}
                      onChange={(event) =>
                        updateArrayItem("experience", index, "start", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    End
                    <input
                      value={item.end}
                      onChange={(event) =>
                        updateArrayItem("experience", index, "end", event.target.value)
                      }
                    />
                  </label>
                </div>
                <label>
                  Impact / Achievements
                  <textarea
                    rows="2"
                    value={item.details}
                    onChange={(event) =>
                      updateArrayItem("experience", index, "details", event.target.value)
                    }
                  />
                </label>
                {data.experience.length > 1 && (
                  <button
                    className={styles.textBtn}
                    type="button"
                    onClick={() => removeArrayItem("experience", index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h3>Projects</h3>
              <button
                className={styles.ghostBtn}
                type="button"
                onClick={() => addArrayItem("projects", emptyProject)}
              >
                Add Project
              </button>
            </div>
            {data.projects.map((item, index) => (
              <div key={`proj-${index}`} className={styles.repeatCard}>
                <label>
                  Project Name
                  <input
                    value={item.name}
                    onChange={(event) =>
                      updateArrayItem("projects", index, "name", event.target.value)
                    }
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows="2"
                    value={item.description}
                    onChange={(event) =>
                      updateArrayItem("projects", index, "description", event.target.value)
                    }
                  />
                </label>
                <label>
                  Link
                  <input
                    value={item.link}
                    onChange={(event) =>
                      updateArrayItem("projects", index, "link", event.target.value)
                    }
                  />
                </label>
                {data.projects.length > 1 && (
                  <button
                    className={styles.textBtn}
                    type="button"
                    onClick={() => removeArrayItem("projects", index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h3>Education</h3>
              <button
                className={styles.ghostBtn}
                type="button"
                onClick={() => addArrayItem("education", emptyEducation)}
              >
                Add Education
              </button>
            </div>
            {data.education.map((item, index) => (
              <div key={`edu-${index}`} className={styles.repeatCard}>
                <div className={styles.gridTwo}>
                  <label>
                    School
                    <input
                      value={item.school}
                      onChange={(event) =>
                        updateArrayItem("education", index, "school", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Degree
                    <input
                      value={item.degree}
                      onChange={(event) =>
                        updateArrayItem("education", index, "degree", event.target.value)
                      }
                    />
                  </label>
                </div>
                <div className={styles.gridTwo}>
                  <label>
                    Start
                    <input
                      value={item.start}
                      onChange={(event) =>
                        updateArrayItem("education", index, "start", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    End
                    <input
                      value={item.end}
                      onChange={(event) =>
                        updateArrayItem("education", index, "end", event.target.value)
                      }
                    />
                  </label>
                </div>
                <label>
                  Notes
                  <textarea
                    rows="2"
                    value={item.details}
                    onChange={(event) =>
                      updateArrayItem("education", index, "details", event.target.value)
                    }
                  />
                </label>
                {data.education.length > 1 && (
                  <button
                    className={styles.textBtn}
                    type="button"
                    onClick={() => removeArrayItem("education", index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <h3>Contact Links</h3>
            <div className={styles.gridTwo}>
              <label>
                Email
                <input
                  value={data.contacts.email}
                  onChange={(event) => handleContactChange("email", event.target.value)}
                />
              </label>
              <label>
                Phone
                <input
                  value={data.contacts.phone}
                  onChange={(event) => handleContactChange("phone", event.target.value)}
                />
              </label>
              <label>
                Location
                <input
                  value={data.contacts.location}
                  onChange={(event) => handleContactChange("location", event.target.value)}
                />
              </label>
              <label>
                Website
                <input
                  value={data.contacts.website}
                  onChange={(event) => handleContactChange("website", event.target.value)}
                />
              </label>
              <label>
                LinkedIn
                <input
                  value={data.contacts.linkedin}
                  onChange={(event) => handleContactChange("linkedin", event.target.value)}
                />
              </label>
              <label>
                GitHub
                <input
                  value={data.contacts.github}
                  onChange={(event) => handleContactChange("github", event.target.value)}
                />
              </label>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h3>Local AI Assist</h3>
              <span className={styles.tag}>{proUnlocked ? "Pro" : "Pro Locked"}</span>
            </div>
            <div className={!proUnlocked ? styles.locked : ""}>
              <label>
                Sentence Improver
                <textarea
                  rows="2"
                  placeholder="Paste a bullet sentence to polish"
                  value={sentenceInput}
                  onChange={(event) => setSentenceInput(event.target.value)}
                />
              </label>
              <div className={styles.aiOutput}>
                <strong>Improved:</strong>
                <p>{improvedSentence || "Polished output shows here."}</p>
              </div>
              <label>
                Job Description Keyword Extractor
                <textarea
                  rows="3"
                  placeholder="Paste a job description"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                />
              </label>
              <div className={styles.keywordRow}>
                {keywordList.length === 0 ? (
                  <span className={styles.muted}>Keywords appear here.</span>
                ) : (
                  keywordList.map((keyword) => (
                    <span key={keyword} className={styles.keywordPill}>
                      {keyword}
                    </span>
                  ))
                )}
              </div>
              <button
                className={styles.ghostBtn}
                type="button"
                onClick={() => setAboutDraft(generateAbout(data))}
              >
                Generate Portfolio About
              </button>
              {aboutDraft && <p className={styles.aiOutput}>{aboutDraft}</p>}
            </div>
            {!proUnlocked && (
              <p className={styles.lockNote}>Unlock Pro to activate local AI tools.</p>
            )}
          </div>
        </section>

        <section className={styles.preview}>
          <div className={`${styles.previewToolbar} noPrint`}>
            <div className={styles.templateToggle}>
              <button
                className={template === "ats" ? styles.primaryBtn : styles.ghostBtn}
                onClick={() => setTemplate("ats")}
              >
                ATS Template
              </button>
              <button
                className={template === "modern" ? styles.primaryBtn : styles.ghostBtn}
                onClick={() => (proUnlocked ? setTemplate("modern") : undefined)}
                disabled={!proUnlocked}
              >
                Modern Template {proUnlocked ? "" : "(Pro)"}
              </button>
            </div>
            <div className={styles.previewActions}>
              <div className={styles.score}>
                <span>Resume strength</span>
                <strong>{strengthScore}%</strong>
                <div className={styles.scoreBar}>
                  <div style={{ width: `${strengthScore}%` }} />
                </div>
              </div>
              <button
                className={styles.primaryBtn}
                onClick={exportPDF}
                disabled={!proUnlocked || view !== "resume"}
              >
                Export Resume PDF {proUnlocked ? "" : "(Pro)"}
              </button>
            </div>
          </div>

          {view === "resume" ? (
            <div
              id="resume-preview"
              className={`${styles.resume} ${
                template === "ats" ? styles.ats : styles.modern
              }`}
            >
              {template === "ats" ? (
                <div className={styles.atsLayout}>
                  <div className={styles.atsHeader}>
                    <div>
                      <h1>{data.name || "Your Name"}</h1>
                      <p>{data.title || "Your Role"}</p>
                    </div>
                    <div className={styles.atsContacts}>
                      {Object.values(data.contacts)
                        .filter(Boolean)
                        .map((item, index) => (
                          <span key={`contact-${index}`}>{item}</span>
                        ))}
                    </div>
                  </div>

                  <section>
                    <h2>Summary</h2>
                    <p>{data.summary}</p>
                  </section>

                  <section>
                    <h2>Skills</h2>
                    <p>{skillsArray.join(", ")}</p>
                  </section>

                  <section>
                    <h2>Experience</h2>
                    {data.experience.map((item, index) => (
                      <div key={`exp-ats-${index}`} className={styles.atsItem}>
                        <div>
                          <strong>{item.role}</strong> · {item.company}
                        </div>
                        <div className={styles.muted}>
                          {item.start} - {item.end}
                        </div>
                        <p>{item.details}</p>
                      </div>
                    ))}
                  </section>

                  <section>
                    <h2>Projects</h2>
                    {data.projects.map((item, index) => (
                      <div key={`proj-ats-${index}`} className={styles.atsItem}>
                        <div>
                          <strong>{item.name}</strong>
                        </div>
                        <p>{item.description}</p>
                        {item.link && <span className={styles.muted}>{item.link}</span>}
                      </div>
                    ))}
                  </section>

                  <section>
                    <h2>Education</h2>
                    {data.education.map((item, index) => (
                      <div key={`edu-ats-${index}`} className={styles.atsItem}>
                        <div>
                          <strong>{item.school}</strong> · {item.degree}
                        </div>
                        <div className={styles.muted}>
                          {item.start} - {item.end}
                        </div>
                        <p>{item.details}</p>
                      </div>
                    ))}
                  </section>
                </div>
              ) : (
                <div className={styles.modernLayout}>
                  <aside className={styles.sidebar}>
                    <div className={styles.avatar}>{initials || "RB"}</div>
                    <h1>{data.name || "Your Name"}</h1>
                    <p className={styles.role}>{data.title || "Your Role"}</p>
                    <div className={styles.sidebarBlock}>
                      <h3>Contact</h3>
                      <div className={styles.sidebarList}>
                        {Object.values(data.contacts)
                          .filter(Boolean)
                          .map((item, index) => (
                            <span key={`contact-modern-${index}`}>{item}</span>
                          ))}
                      </div>
                    </div>
                    <div className={styles.sidebarBlock}>
                      <h3>Skills</h3>
                      <div className={styles.skillPills}>
                        {skillsArray.map((skill) => (
                          <span key={skill} className={styles.skillPill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </aside>
                  <div className={styles.mainContent}>
                    <section className={styles.summaryBlock}>
                      <h2>Profile</h2>
                      <p>{data.summary}</p>
                    </section>
                    <section>
                      <h2>Experience</h2>
                      <div className={styles.timeline}>
                        {data.experience.map((item, index) => (
                          <div key={`exp-modern-${index}`} className={styles.timelineItem}>
                            <div className={styles.timelineDot} />
                            <div>
                              <div className={styles.timelineHeader}>
                                <strong>{item.role}</strong>
                                <span>
                                  {item.company} · {item.start} - {item.end}
                                </span>
                              </div>
                              <p>{item.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h2>Projects</h2>
                      <div className={styles.projectGrid}>
                        {data.projects.map((item, index) => (
                          <div key={`proj-modern-${index}`} className={styles.projectCard}>
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                            {item.link && <span className={styles.projectLink}>{item.link}</span>}
                          </div>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h2>Education</h2>
                      <div className={styles.eduGrid}>
                        {data.education.map((item, index) => (
                          <div key={`edu-modern-${index}`} className={styles.eduCard}>
                            <strong>{item.school}</strong>
                            <span>{item.degree}</span>
                            <span className={styles.muted}>
                              {item.start} - {item.end}
                            </span>
                            <p>{item.details}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.portfolio}>
              <section className={styles.hero}>
                <div>
                  <p className={styles.kicker}>Portfolio</p>
                  <h1>{data.name || "Your Name"}</h1>
                  <p className={styles.heroRole}>{data.title || "Your Role"}</p>
                  <p className={styles.heroSummary}>{data.summary}</p>
                  <div className={styles.heroActions}>
                    <button className={styles.primaryBtn}>Download Resume</button>
                    <button className={styles.ghostBtn}>Contact</button>
                  </div>
                </div>
                <div className={styles.heroCard}>
                  <h3>Core Skills</h3>
                  <div className={styles.skillPills}>
                    {skillsArray.slice(0, 8).map((skill) => (
                      <span key={`hero-skill-${skill}`} className={styles.skillPill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className={styles.about}>
                <h2>About</h2>
                <p>{aboutDraft || generateAbout(data)}</p>
              </section>

              <section className={styles.portfolioProjects}>
                <h2>Selected Projects</h2>
                <div className={styles.projectGrid}>
                  {data.projects.map((item, index) => (
                    <article key={`portfolio-proj-${index}`} className={styles.projectCard}>
                      <h4>{item.name}</h4>
                      <p>{item.description}</p>
                      {item.link && <span className={styles.projectLink}>{item.link}</span>}
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.contactSection}>
                <h2>Contact</h2>
                <div className={styles.contactGrid}>
                  {Object.values(data.contacts)
                    .filter(Boolean)
                    .map((item, index) => (
                      <span key={`contact-portfolio-${index}`}>{item}</span>
                    ))}
                </div>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;



