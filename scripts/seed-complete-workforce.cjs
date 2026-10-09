const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envFile = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
let migrationUrl = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('DATABASE_MIGRATION_URL=')) {
    migrationUrl = line.substring('DATABASE_MIGRATION_URL='.length).trim();
  }
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).trim();
  }
}

const connectionString = migrationUrl || dbUrl;
if (!connectionString) {
  console.error('Neither DATABASE_MIGRATION_URL nor DATABASE_URL found in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString });

const ROLES_CONFIG = [
  {
    role: 'Senior Full Stack Engineer',
    dept: 'Engineering',
    marketSalaryMin: 24, marketSalaryMax: 36, marketSalaryAvg: 28,
    rateMin: 2000, rateMax: 2800, rateAvg: 2400,
    primarySkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'GraphQL'],
    training: {
      'React': { days: 15, cost: 25000, adj: ['JavaScript', 'HTML5'], cat: 'Frontend Development' },
      'Node.js': { days: 14, cost: 22000, adj: ['JavaScript', 'Express.js'], cat: 'Backend Development' },
      'TypeScript': { days: 12, cost: 20000, adj: ['JavaScript'], cat: 'Programming Languages' },
      'PostgreSQL': { days: 14, cost: 24000, adj: ['SQL', 'Relational Databases'], cat: 'Database Management' },
      'GraphQL': { days: 10, cost: 18000, adj: ['REST APIs', 'JSON'], cat: 'API Technologies' },
    }
  },
  {
    role: 'Frontend React Engineer',
    dept: 'Engineering',
    marketSalaryMin: 16, marketSalaryMax: 26, marketSalaryAvg: 20,
    rateMin: 1400, rateMax: 2200, rateAvg: 1800,
    primarySkills: ['React', 'JavaScript', 'HTML5', 'Redux', 'Next.js'],
    training: {
      'Next.js': { days: 14, cost: 22000, adj: ['React', 'Server-Side Rendering'], cat: 'Frontend Frameworks' },
      'Redux': { days: 10, cost: 16000, adj: ['State Management', 'React'], cat: 'Frontend Architecture' },
      'HTML5': { days: 7, cost: 12000, adj: ['Web Standards'], cat: 'Web Development' },
      'JavaScript': { days: 15, cost: 20000, adj: ['ECMAScript'], cat: 'Programming Languages' },
    }
  },
  {
    role: 'Backend Go Engineer',
    dept: 'Core Services',
    marketSalaryMin: 22, marketSalaryMax: 36, marketSalaryAvg: 27,
    rateMin: 1800, rateMax: 2600, rateAvg: 2200,
    primarySkills: ['Go', 'Microservices', 'gRPC', 'Docker', 'PostgreSQL'],
    training: {
      'Go': { days: 20, cost: 30000, adj: ['C', 'Concurrency'], cat: 'Systems Programming' },
      'Microservices': { days: 16, cost: 26000, adj: ['Distributed Architecture'], cat: 'Architecture' },
      'gRPC': { days: 10, cost: 18000, adj: ['Protocol Buffers', 'RPC'], cat: 'Networking & Protocols' },
    }
  },
  {
    role: 'Cloud DevOps Engineer',
    dept: 'Infrastructure',
    marketSalaryMin: 20, marketSalaryMax: 34, marketSalaryAvg: 25,
    rateMin: 1700, rateMax: 2500, rateAvg: 2100,
    primarySkills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    training: {
      'AWS': { days: 21, cost: 35000, adj: ['Cloud Computing'], cat: 'Cloud Platforms' },
      'Kubernetes': { days: 21, cost: 35000, adj: ['Container Orchestration', 'Docker'], cat: 'DevOps & Containers' },
      'Terraform': { days: 14, cost: 25000, adj: ['Infrastructure as Code'], cat: 'Cloud Automation' },
      'Docker': { days: 10, cost: 18000, adj: ['Linux Containers'], cat: 'DevOps & Containers' },
      'CI/CD': { days: 10, cost: 16000, adj: ['GitHub Actions', 'Jenkins'], cat: 'DevOps & Continuous Delivery' },
    }
  },
  {
    role: 'Data Engineer',
    dept: 'Data & Analytics',
    marketSalaryMin: 18, marketSalaryMax: 32, marketSalaryAvg: 24,
    rateMin: 1600, rateMax: 2400, rateAvg: 2000,
    primarySkills: ['Python', 'Apache Spark', 'SQL', 'Snowflake', 'Airflow'],
    training: {
      'Apache Spark': { days: 25, cost: 38000, adj: ['Distributed Computing', 'Big Data'], cat: 'Big Data Frameworks' },
      'Snowflake': { days: 14, cost: 28000, adj: ['Cloud Warehousing', 'SQL'], cat: 'Data Platforms' },
      'Airflow': { days: 12, cost: 22000, adj: ['Workflow Orchestration', 'Python'], cat: 'Data Engineering Tools' },
      'Python': { days: 18, cost: 25000, adj: ['Scripting', 'Data Processing'], cat: 'Programming Languages' },
      'SQL': { days: 10, cost: 15000, adj: ['Relational Databases'], cat: 'Database Languages' },
    }
  },
  {
    role: 'AI / Machine Learning Engineer',
    dept: 'AI Labs',
    marketSalaryMin: 26, marketSalaryMax: 45, marketSalaryAvg: 34,
    rateMin: 2400, rateMax: 3500, rateAvg: 2900,
    primarySkills: ['Python', 'PyTorch', 'TensorFlow', 'MLOps', 'NLP'],
    training: {
      'PyTorch': { days: 30, cost: 45000, adj: ['Deep Learning', 'Tensors'], cat: 'Machine Learning Frameworks' },
      'TensorFlow': { days: 28, cost: 42000, adj: ['Deep Learning'], cat: 'Machine Learning Frameworks' },
      'MLOps': { days: 20, cost: 35000, adj: ['Model Deployment', 'Docker'], cat: 'AI Operations' },
      'NLP': { days: 25, cost: 40000, adj: ['Natural Language Processing', 'Transformers'], cat: 'Artificial Intelligence' },
    }
  },
  {
    role: 'Platform Security Engineer',
    dept: 'Security',
    marketSalaryMin: 24, marketSalaryMax: 40, marketSalaryAvg: 30,
    rateMin: 2200, rateMax: 3200, rateAvg: 2700,
    primarySkills: ['Cloud Security', 'IAM', 'Penetration Testing', 'SIEM', 'Kubernetes Security'],
    training: {
      'Cloud Security': { days: 18, cost: 30000, adj: ['AWS Security', 'Zero Trust'], cat: 'Cybersecurity' },
      'Kubernetes Security': { days: 20, cost: 35000, adj: ['Container Hardening'], cat: 'DevSecOps' },
      'Penetration Testing': { days: 25, cost: 40000, adj: ['Ethical Hacking', 'OWASP'], cat: 'Application Security' },
      'IAM': { days: 12, cost: 20000, adj: ['Identity Governance', 'OAuth'], cat: 'Security Architecture' },
      'SIEM': { days: 14, cost: 24000, adj: ['Threat Detection', 'Splunk'], cat: 'Security Operations' },
    }
  },
  {
    role: 'Mobile Engineer (iOS / Android)',
    dept: 'Mobile Apps',
    marketSalaryMin: 16, marketSalaryMax: 28, marketSalaryAvg: 21,
    rateMin: 1400, rateMax: 2200, rateAvg: 1800,
    primarySkills: ['Swift', 'Kotlin', 'React Native', 'Mobile Architecture', 'REST APIs'],
    training: {
      'Swift': { days: 21, cost: 30000, adj: ['iOS Development', 'Cocoa'], cat: 'Mobile Development' },
      'Kotlin': { days: 20, cost: 28000, adj: ['Android SDK', 'Java'], cat: 'Mobile Development' },
      'React Native': { days: 18, cost: 26000, adj: ['Cross-Platform Mobile'], cat: 'Mobile Frameworks' },
      'Mobile Architecture': { days: 12, cost: 20000, adj: ['MVVM', 'Clean Architecture'], cat: 'Software Architecture' },
      'REST APIs': { days: 8, cost: 14000, adj: ['HTTP', 'JSON'], cat: 'API Technologies' },
    }
  },
  {
    role: 'Site Reliability Engineer (SRE)',
    dept: 'Reliability',
    marketSalaryMin: 22, marketSalaryMax: 36, marketSalaryAvg: 27,
    rateMin: 1800, rateMax: 2700, rateAvg: 2250,
    primarySkills: ['Linux', 'Prometheus', 'Grafana', 'Incident Management', 'Python'],
    training: {
      'Linux': { days: 14, cost: 20000, adj: ['System Administration', 'Shell Scripting'], cat: 'Operating Systems' },
      'Prometheus': { days: 12, cost: 20000, adj: ['Metrics Monitoring', 'Alerting'], cat: 'Observability' },
      'Grafana': { days: 10, cost: 16000, adj: ['Dashboarding', 'Data Visualization'], cat: 'Observability' },
      'Incident Management': { days: 10, cost: 15000, adj: ['SRE Practices', 'Postmortems'], cat: 'IT Operations' },
    }
  },
  {
    role: 'Product Manager',
    dept: 'Product',
    marketSalaryMin: 24, marketSalaryMax: 42, marketSalaryAvg: 30,
    rateMin: 2000, rateMax: 3000, rateAvg: 2500,
    primarySkills: ['Product Strategy', 'Agile Methodologies', 'User Research', 'Roadmapping', 'Data Analytics'],
    training: {
      'Product Strategy': { days: 15, cost: 30000, adj: ['Market Analysis', 'Value Proposition'], cat: 'Product Management' },
      'User Research': { days: 10, cost: 20000, adj: ['User Interviews', 'Customer Journey'], cat: 'User Research' },
      'Roadmapping': { days: 10, cost: 18000, adj: ['Prioritization Frameworks'], cat: 'Product Planning' },
      'Agile Methodologies': { days: 8, cost: 15000, adj: ['Scrum', 'Kanban'], cat: 'Project Management' },
      'Data Analytics': { days: 14, cost: 22000, adj: ['A/B Testing', 'Metrics'], cat: 'Analytics' },
    }
  },
  {
    role: 'Engineering Manager',
    dept: 'Leadership',
    marketSalaryMin: 38, marketSalaryMax: 58, marketSalaryAvg: 46,
    rateMin: 3000, rateMax: 4500, rateAvg: 3700,
    primarySkills: ['Technical Leadership', 'People Management', 'System Design', 'Delivery Management', 'Agile Coaching'],
    training: {
      'Technical Leadership': { days: 14, cost: 35000, adj: ['Mentorship', 'Architecture Review'], cat: 'Engineering Leadership' },
      'People Management': { days: 14, cost: 30000, adj: ['Performance Reviews', 'Retention'], cat: 'Leadership & HR' },
      'System Design': { days: 20, cost: 40000, adj: ['High Scalability', 'Reliability'], cat: 'Software Architecture' },
      'Delivery Management': { days: 12, cost: 25000, adj: ['Sprint Execution', 'KPI Tracking'], cat: 'Delivery Management' },
      'Agile Coaching': { days: 10, cost: 20000, adj: ['Team Dynamics', 'Continuous Improvement'], cat: 'Agile Practices' },
    }
  },
  {
    role: 'UI/UX Product Designer',
    dept: 'Design',
    marketSalaryMin: 15, marketSalaryMax: 26, marketSalaryAvg: 19,
    rateMin: 1300, rateMax: 2100, rateAvg: 1700,
    primarySkills: ['Figma', 'Design Systems', 'Wireframing', 'Usability Testing', 'Prototyping'],
    training: {
      'Figma': { days: 10, cost: 16000, adj: ['Vector Design', 'Component Libraries'], cat: 'Design Tools' },
      'Design Systems': { days: 12, cost: 20000, adj: ['Typography', 'UI Tokens'], cat: 'Design Systems' },
      'Wireframing': { days: 8, cost: 14000, adj: ['Information Architecture'], cat: 'UX Design' },
      'Usability Testing': { days: 10, cost: 18000, adj: ['Heuristic Evaluation'], cat: 'UX Research' },
      'Prototyping': { days: 10, cost: 16000, adj: ['Interactive Mockups'], cat: 'Design Tools' },
    }
  },
  {
    role: 'Data Scientist',
    dept: 'Data Science',
    marketSalaryMin: 20, marketSalaryMax: 36, marketSalaryAvg: 26,
    rateMin: 1800, rateMax: 2600, rateAvg: 2200,
    primarySkills: ['Python', 'Machine Learning', 'Statistics', 'R', 'Pandas'],
    training: {
      'Machine Learning': { days: 25, cost: 38000, adj: ['Scikit-Learn', 'Supervised Learning'], cat: 'Data Science' },
      'Statistics': { days: 18, cost: 25000, adj: ['Hypothesis Testing', 'Probability'], cat: 'Mathematical Sciences' },
      'R': { days: 15, cost: 22000, adj: ['Statistical Analysis'], cat: 'Programming Languages' },
      'Pandas': { days: 10, cost: 16000, adj: ['Data Wrangling', 'NumPy'], cat: 'Data Processing' },
    }
  },
  {
    role: 'QA Automation Engineer',
    dept: 'Quality Assurance',
    marketSalaryMin: 12, marketSalaryMax: 22, marketSalaryAvg: 16,
    rateMin: 1100, rateMax: 1700, rateAvg: 1400,
    primarySkills: ['Selenium', 'Cypress', 'Playwright', 'Java', 'Test Automation'],
    training: {
      'Playwright': { days: 14, cost: 20000, adj: ['End-to-End Testing', 'Chromium'], cat: 'Test Automation Frameworks' },
      'Cypress': { days: 10, cost: 18000, adj: ['Browser Testing', 'JavaScript'], cat: 'Test Automation Frameworks' },
      'Selenium': { days: 12, cost: 18000, adj: ['WebDriver', 'Automated QA'], cat: 'Test Automation Frameworks' },
      'Java': { days: 16, cost: 22000, adj: ['Object-Oriented Programming'], cat: 'Programming Languages' },
      'Test Automation': { days: 12, cost: 18000, adj: ['CI Testing', 'Test Frameworks'], cat: 'Quality Assurance' },
    }
  },
  {
    role: 'Database Administrator (DBA)',
    dept: 'Infrastructure',
    marketSalaryMin: 16, marketSalaryMax: 28, marketSalaryAvg: 21,
    rateMin: 1400, rateMax: 2200, rateAvg: 1800,
    primarySkills: ['PostgreSQL', 'MySQL', 'Database Tuning', 'Backup & Recovery', 'High Availability'],
    training: {
      'MySQL': { days: 14, cost: 22000, adj: ['SQL', 'Relational Databases'], cat: 'Database Management' },
      'Database Tuning': { days: 15, cost: 25000, adj: ['Query Optimization', 'Indexing'], cat: 'Database Administration' },
      'Backup & Recovery': { days: 10, cost: 18000, adj: ['Disaster Recovery'], cat: 'Database Administration' },
      'High Availability': { days: 14, cost: 24000, adj: ['Replication', 'Clustering'], cat: 'Database Administration' },
    }
  },
  {
    role: 'Enterprise Solutions Architect',
    dept: 'Architecture',
    marketSalaryMin: 36, marketSalaryMax: 56, marketSalaryAvg: 45,
    rateMin: 3000, rateMax: 4400, rateAvg: 3700,
    primarySkills: ['Enterprise Architecture', 'Cloud Architecture', 'Microservices', 'TOGAF', 'System Integration'],
    training: {
      'Enterprise Architecture': { days: 20, cost: 45000, adj: ['Enterprise IT Strategy'], cat: 'Enterprise Architecture' },
      'Cloud Architecture': { days: 20, cost: 40000, adj: ['Multi-Region Design'], cat: 'Cloud Platforms' },
      'TOGAF': { days: 15, cost: 35000, adj: ['Architecture Frameworks'], cat: 'Standards & Governance' },
      'System Integration': { days: 14, cost: 28000, adj: ['Middleware', 'EAI'], cat: 'Integration' },
    }
  },
  {
    role: 'Cybersecurity Analyst',
    dept: 'Security',
    marketSalaryMin: 14, marketSalaryMax: 25, marketSalaryAvg: 18,
    rateMin: 1200, rateMax: 1900, rateAvg: 1550,
    primarySkills: ['Vulnerability Assessment', 'Network Security', 'SOC Operations', 'Threat Intelligence', 'Compliance'],
    training: {
      'Vulnerability Assessment': { days: 14, cost: 22000, adj: ['Nessus', 'CVE Scanning'], cat: 'Security Assessment' },
      'Network Security': { days: 14, cost: 24000, adj: ['Firewalls', 'VPNs', 'IDS/IPS'], cat: 'Network Security' },
      'SOC Operations': { days: 15, cost: 25000, adj: ['Incident Triage', 'Log Analysis'], cat: 'Security Operations' },
      'Threat Intelligence': { days: 14, cost: 22000, adj: ['MITRE ATT&CK'], cat: 'Security Intelligence' },
      'Compliance': { days: 10, cost: 18000, adj: ['ISO 27001', 'SOC 2'], cat: 'Compliance & Governance' },
    }
  },
  {
    role: 'Systems / Embedded Software Engineer',
    dept: 'Hardware Engineering',
    marketSalaryMin: 16, marketSalaryMax: 30, marketSalaryAvg: 22,
    rateMin: 1500, rateMax: 2300, rateAvg: 1900,
    primarySkills: ['C', 'C++', 'RTOS', 'Device Drivers', 'Linux Kernel'],
    training: {
      'C': { days: 18, cost: 24000, adj: ['Low-Level Programming'], cat: 'Programming Languages' },
      'C++': { days: 20, cost: 28000, adj: ['Object-Oriented C++'], cat: 'Programming Languages' },
      'RTOS': { days: 21, cost: 32000, adj: ['FreeRTOS', 'Embedded Systems'], cat: 'Embedded Systems' },
      'Device Drivers': { days: 25, cost: 38000, adj: ['Hardware Interfacing'], cat: 'Kernel & Drivers' },
      'Linux Kernel': { days: 25, cost: 38000, adj: ['Kernel Modules'], cat: 'Operating Systems' },
    }
  },
  {
    role: 'API Integration Specialist',
    dept: 'Integration Services',
    marketSalaryMin: 15, marketSalaryMax: 26, marketSalaryAvg: 19,
    rateMin: 1300, rateMax: 2000, rateAvg: 1650,
    primarySkills: ['REST APIs', 'API Gateway', 'OAuth2', 'Postman', 'Webhooks'],
    training: {
      'API Gateway': { days: 12, cost: 18000, adj: ['Kong', 'Apigee'], cat: 'API Management' },
      'OAuth2': { days: 10, cost: 16000, adj: ['Authentication', 'JWT'], cat: 'Security & Auth' },
      'Postman': { days: 7, cost: 12000, adj: ['API Testing'], cat: 'Developer Tools' },
      'Webhooks': { days: 8, cost: 14000, adj: ['Event-Driven Architecture'], cat: 'Integration' },
    }
  },
  {
    role: 'Business Intelligence Analyst',
    dept: 'BI & Reporting',
    marketSalaryMin: 12, marketSalaryMax: 22, marketSalaryAvg: 16,
    rateMin: 1100, rateMax: 1700, rateAvg: 1400,
    primarySkills: ['Power BI', 'Tableau', 'SQL', 'Data Modeling', 'Dashboard Design'],
    training: {
      'Power BI': { days: 14, cost: 20000, adj: ['DAX', 'Power Query'], cat: 'BI Tools' },
      'Tableau': { days: 14, cost: 20000, adj: ['Tableau Server', 'Calculated Fields'], cat: 'BI Tools' },
      'Data Modeling': { days: 14, cost: 22000, adj: ['Star Schema', 'Data Marts'], cat: 'Data Architecture' },
      'Dashboard Design': { days: 10, cost: 16000, adj: ['Executive Visualizations'], cat: 'Reporting & Analytics' },
    }
  },
  {
    role: 'Technical Support Engineer',
    dept: 'Customer Operations',
    marketSalaryMin: 8, marketSalaryMax: 15, marketSalaryAvg: 11,
    rateMin: 700, rateMax: 1200, rateAvg: 950,
    primarySkills: ['ITIL', 'Technical Troubleshooting', 'Linux Administration', 'Ticketing Systems', 'Customer Communication'],
    training: {
      'ITIL': { days: 10, cost: 15000, adj: ['Service Management'], cat: 'IT Operations' },
      'Technical Troubleshooting': { days: 10, cost: 14000, adj: ['Root Cause Analysis'], cat: 'Support & Operations' },
      'Linux Administration': { days: 15, cost: 18000, adj: ['Shell', 'Networking'], cat: 'System Administration' },
      'Ticketing Systems': { days: 6, cost: 10000, adj: ['Jira Service Desk', 'Zendesk'], cat: 'Support Tools' },
      'Customer Communication': { days: 8, cost: 12000, adj: ['Stakeholder Management'], cat: 'Professional Skills' },
    }
  },
  {
    role: 'Cloud Infrastructure Architect',
    dept: 'Cloud Platforms',
    marketSalaryMin: 35, marketSalaryMax: 54, marketSalaryAvg: 42,
    rateMin: 2800, rateMax: 4000, rateAvg: 3400,
    primarySkills: ['AWS', 'Azure', 'Terraform', 'Cost Optimization', 'Multi-Cloud Strategy'],
    training: {
      'Azure': { days: 20, cost: 35000, adj: ['Microsoft Cloud'], cat: 'Cloud Platforms' },
      'Cost Optimization': { days: 12, cost: 22000, adj: ['FinOps', 'Resource Sizing'], cat: 'Cloud Management' },
      'Multi-Cloud Strategy': { days: 18, cost: 35000, adj: ['Hybrid Cloud', 'Disaster Recovery'], cat: 'Cloud Architecture' },
    }
  },
  {
    role: 'MLOps Engineer',
    dept: 'AI Infrastructure',
    marketSalaryMin: 22, marketSalaryMax: 38, marketSalaryAvg: 28,
    rateMin: 2000, rateMax: 3000, rateAvg: 2500,
    primarySkills: ['Kubeflow', 'MLflow', 'Docker', 'Python', 'Model Deployment'],
    training: {
      'Kubeflow': { days: 18, cost: 32000, adj: ['Kubernetes', 'ML Pipelines'], cat: 'MLOps Platforms' },
      'MLflow': { days: 14, cost: 24000, adj: ['Experiment Tracking', 'Model Registry'], cat: 'MLOps Platforms' },
      'Model Deployment': { days: 14, cost: 25000, adj: ['Triton', 'FastAPI'], cat: 'Machine Learning Engineering' },
    }
  },
  {
    role: 'Agile Scrum Master',
    dept: 'Agile Practice',
    marketSalaryMin: 16, marketSalaryMax: 28, marketSalaryAvg: 20,
    rateMin: 1400, rateMax: 2200, rateAvg: 1800,
    primarySkills: ['Scrum', 'Kanban', 'JIRA', 'Agile Coaching', 'Sprint Planning'],
    training: {
      'Scrum': { days: 10, cost: 18000, adj: ['Scrum Framework', 'Agile Ceremonies'], cat: 'Agile Methodologies' },
      'Kanban': { days: 10, cost: 16000, adj: ['WIP Limits', 'Cycle Time'], cat: 'Agile Methodologies' },
      'JIRA': { days: 8, cost: 14000, adj: ['Agile Boards', 'Workflow Automation'], cat: 'Project Management Tools' },
      'Sprint Planning': { days: 8, cost: 14000, adj: ['Estimation', 'Story Pointing'], cat: 'Agile Practices' },
    }
  },
  {
    role: 'SecOps Engineer',
    dept: 'Security Operations',
    marketSalaryMin: 18, marketSalaryMax: 32, marketSalaryAvg: 24,
    rateMin: 1600, rateMax: 2400, rateAvg: 2000,
    primarySkills: ['Security Automation', 'DevSecOps', 'Vulnerability Management', 'Python', 'SIEM'],
    training: {
      'Security Automation': { days: 16, cost: 28000, adj: ['SOAR', 'Scripting'], cat: 'Security Engineering' },
      'DevSecOps': { days: 18, cost: 30000, adj: ['CI/CD Security', 'SAST/DAST'], cat: 'DevSecOps' },
      'Vulnerability Management': { days: 14, cost: 22000, adj: ['Patch Management', 'Remediation'], cat: 'Security Operations' },
    }
  }
];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Amit', 'Ananya', 'Arjun', 'Bhavya', 'Chetan', 'Deepika', 'Divya', 'Gaurav',
  'Harish', 'Isha', 'Kavita', 'Kiran', 'Kunal', 'Manish', 'Meera', 'Neha', 'Nikhil', 'Pooja',
  'Pradeep', 'Priya', 'Rahul', 'Rajesh', 'Ramesh', 'Rhea', 'Rohan', 'Rohit', 'Sachin', 'Sameer',
  'Sangeeta', 'Sanjay', 'Santosh', 'Shalini', 'Shreya', 'Siddharth', 'Sneha', 'Sourabh', 'Suresh', 'Swati',
  'Tanvi', 'Tarun', 'Varun', 'Venkatesh', 'Vidya', 'Vikas', 'Vikram', 'Vinay', 'Yash', 'Zoya'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Rao', 'Kumar', 'Singh', 'Gupta',
  'Deshmukh', 'Kulkarni', 'Joshi', 'Mehta', 'Bhat', 'Menon', 'Chopra', 'Malhotra', 'Aggarwal', 'Saxena',
  'Banerjee', 'Chatterjee', 'Mukherjee', 'Pillai', 'Shetty', 'Hegde', 'Gowda', 'Mishra', 'Pandey', 'Tiwari'
];

const COMPANIES = ['Nexus Labs', 'CloudScale Systems', 'FinTech Spark', 'Infosys', 'Wipro', 'TCS', 'Razorpay', 'Flipkart', 'Swiggy', 'Freshworks'];
const LOCATIONS = ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR', 'Remote'];

function getRandomItem(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

async function run() {
  console.log('🚀 Starting complete seed process for Workforce Advisory...');
  const client = await pool.connect();

  try {
    const userRes = await client.query('SELECT id, name, email FROM "user"');
    console.log('Registered users found:', userRes.rows);

    const targetUsers = userRes.rows.filter(u => 
      ['rajatharun12@gmail.com', 'rajatharun881@gmail.com'].includes(u.email)
    );

    if (!targetUsers.length) {
      console.error('No matching owner user found!');
      return;
    }

    console.log(`Will seed data for ${targetUsers.length} user(s):`, targetUsers.map(u => u.email).join(', '));

    // 1. Ensure / Upsert Skills into `skills` table with Training Estimates
    console.log('Updating skills catalog with training estimates and adjacencies...');
    for (const rConfig of ROLES_CONFIG) {
      for (const [skillName, tInfo] of Object.entries(rConfig.training || {})) {
        const id = 'skill-' + crypto.createHash('sha256').update(skillName.toLowerCase()).digest('hex').slice(0, 16);
        const normName = skillName.toLowerCase();
        const payload = {
          id,
          name: skillName,
          category: tInfo.cat || 'Technology',
          aliases: [],
          trainingDays: tInfo.days,
          trainingCost: tInfo.cost,
          adjacent: tInfo.adj || [],
          trainingEvidence: `Evidenced curriculum and corporate training benchmark (${tInfo.days} days, ₹${tInfo.cost})`
        };

        await client.query(`
          INSERT INTO skills (id, name, normalized_name, category, aliases, payload)
          VALUES ($1, $2, $3, $4, '{}'::text[], $5)
          ON CONFLICT (normalized_name) 
          DO UPDATE SET payload = EXCLUDED.payload, category = EXCLUDED.category
        `, [id, skillName, normName, payload.category, JSON.stringify(payload)]);
      }
    }

    // 2. Clear previous tables if any (using TRUNCATE to avoid triggering FOR EACH ROW triggers)
    console.log('Clearing existing data across tables...');
    await client.query(`
      TRUNCATE TABLE 
        resource_reservations,
        recruitment_events,
        recruitment_applications,
        recruitment_jobs,
        talent_profiles,
        course_events,
        workforce_outcomes,
        pay_policies,
        action_history,
        actions,
        decision_audit,
        decisions,
        scenarios,
        strategy_scores,
        requirement_skills,
        requirements,
        talent_records,
        import_batches,
        normalization_reviews
      CASCADE
    `);

    for (const user of targetUsers) {
      console.log(`\n======================================================`);
      console.log(`Processing Workspace for User: ${user.name} (${user.email}, ID: ${user.id})`);
      console.log(`======================================================`);

      const ownerId = user.id;

      // 3. Create Import Batch
      const batchId = crypto.randomUUID();
      const batchChecksum = crypto.createHash('sha256').update(`workforce-master-batch-${ownerId}`).digest('hex');
      const observedAt = new Date().toISOString();
      await client.query(`
        INSERT INTO import_batches (id, owner_id, source_name, checksum, observed_at, record_count, authority)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [batchId, ownerId, 'HRIS Master Export 2026', batchChecksum, observedAt, 25 * 50 + 25 * 12, 'Authorized by Chief People Officer under consent agreements']);

      // 4. Generate 50 employee records per role (25 * 50 = 1250) + 6 contractors + 6 candidates per role (300) = 1550 records
      console.log('Generating and inserting 1,250 employees + 150 contractors + 150 candidates (1,550 total talent records)...');
      
      const allTalentRecords = [];
      const employeesByRole = {};

      let personCounter = 1;

      for (let rIdx = 0; rIdx < ROLES_CONFIG.length; rIdx++) {
        const rConf = ROLES_CONFIG[rIdx];
        employeesByRole[rConf.role] = [];

        // 50 Employees
        for (let eIdx = 0; eIdx < 50; eIdx++) {
          const fn = FIRST_NAMES[(rIdx * 50 + eIdx) % FIRST_NAMES.length];
          const ln = LAST_NAMES[(rIdx * 7 + eIdx * 3) % LAST_NAMES.length];
          const name = `${fn} ${ln}`;
          const externalId = `EMP-${String(personCounter).padStart(5, '0')}`;
          personCounter++;

          const exp = Math.min(18, Math.max(1, Math.round(1 + (eIdx % 16) + (rIdx % 3) * 0.5)));
          const level = exp < 2 ? 'Junior' : exp < 5 ? 'Mid' : exp < 9 ? 'Senior' : 'Lead';
          
          // Realistic salary based on level and role bounds
          const baseSal = rConf.marketSalaryMin + (exp / 18) * (rConf.marketSalaryMax - rConf.marketSalaryMin);
          const salary = Math.round((baseSal + (eIdx % 3 - 1) * 1.5) * 10) / 10;
          
          const company = COMPANIES[(eIdx + rIdx) % COMPANIES.length];
          const location = LOCATIONS[(eIdx * 2 + rIdx) % LOCATIONS.length];
          const avail = (eIdx % 5 === 0) ? 0 : (eIdx % 4 === 0) ? 14 : (eIdx % 3 === 0) ? 30 : 45;
          const perf = Math.min(98, Math.max(72, Math.round(78 + (eIdx % 20) * 1.0)));
          const learning = Math.min(98, Math.max(68, Math.round(75 + (eIdx % 22) * 1.0)));
          const promo = (eIdx % 3 === 0) || (perf >= 90);

          // Skills map
          const skillsMap = {};
          for (let sIdx = 0; sIdx < rConf.primarySkills.length; sIdx++) {
            const sk = rConf.primarySkills[sIdx];
            // ensure primary skill is strong for most employees (80-98), with some having skill gaps (50-64) to show learning recommendations
            const isGap = (eIdx % 6 === 0 && sIdx >= 2);
            const prof = isGap ? Math.round(52 + (eIdx % 12)) : Math.min(98, Math.round(82 + (eIdx % 16)));
            skillsMap[sk] = prof;
          }

          const projects = [
            `Enterprise ${rConf.dept} Transformation`,
            `High-Throughput ${rConf.primarySkills[0]} Migration`,
            `Global Core Architecture v3`
          ].slice(0, 2 + (eIdx % 2));

          const certs = [
            `${rConf.primarySkills[0]} Professional Certified`,
            exp > 5 ? 'AWS Certified Solutions Architect' : 'Cloud Practitioner'
          ];

          const personId = crypto.createHash('sha256').update(`${ownerId}\0employee\0${externalId}`).digest('hex');

          const payload = {
            id: personId,
            sourceId: batchId,
            externalId,
            name,
            kind: 'employee',
            role: rConf.role,
            company,
            level,
            location,
            experience: exp,
            salary,
            rate: 0,
            availability: avail,
            performance: perf,
            learning,
            promotionEligible: promo,
            skills: skillsMap,
            projects,
            certifications: certs,
            conversionInterest: 'No'
          };

          allTalentRecords.push({ id: personId, externalId, kind: 'employee', payload });
          employeesByRole[rConf.role].push(payload);
        }

        // 6 Contractors per role
        for (let cIdx = 0; cIdx < 6; cIdx++) {
          const fn = FIRST_NAMES[(rIdx * 11 + cIdx * 7) % FIRST_NAMES.length];
          const ln = LAST_NAMES[(rIdx * 5 + cIdx * 2 + 1) % LAST_NAMES.length];
          const name = `${fn} ${ln} (Contractor)`;
          const externalId = `CTR-${String(personCounter).padStart(5, '0')}`;
          personCounter++;

          const exp = Math.min(16, 4 + cIdx * 2);
          const rate = Math.round(rConf.rateMin + (cIdx / 6) * (rConf.rateMax - rConf.rateMin));
          const location = LOCATIONS[(cIdx * 3 + rIdx) % LOCATIONS.length];
          const avail = cIdx * 5; // very fast availability for contractors
          const perf = Math.min(96, Math.max(78, 82 + cIdx * 2));
          
          const skillsMap = {};
          for (const sk of rConf.primarySkills) {
            skillsMap[sk] = Math.min(98, Math.round(85 + (cIdx % 12)));
          }

          const personId = crypto.createHash('sha256').update(`${ownerId}\0contractor\0${externalId}`).digest('hex');
          const payload = {
            id: personId,
            sourceId: batchId,
            externalId,
            name,
            kind: 'contractor',
            role: rConf.role,
            company: 'Independent / VMS',
            level: exp < 5 ? 'Mid' : exp < 9 ? 'Senior' : 'Lead',
            location,
            experience: exp,
            salary: 0,
            rate,
            availability: avail,
            performance: perf,
            learning: 80,
            promotionEligible: false,
            skills: skillsMap,
            projects: [`Specialized ${rConf.role} Surge Delivery`],
            certifications: [`Advanced ${rConf.primarySkills[0]} Practitioner`],
            conversionInterest: (cIdx % 2 === 0) ? 'Yes' : 'Unknown'
          };

          allTalentRecords.push({ id: personId, externalId, kind: 'contractor', payload });
        }

        // 6 Candidates per role
        for (let aIdx = 0; aIdx < 6; aIdx++) {
          const fn = FIRST_NAMES[(rIdx * 13 + aIdx * 5 + 3) % FIRST_NAMES.length];
          const ln = LAST_NAMES[(rIdx * 3 + aIdx * 4 + 2) % LAST_NAMES.length];
          const name = `${fn} ${ln} (Candidate)`;
          const externalId = `CND-${String(personCounter).padStart(5, '0')}`;
          personCounter++;

          const exp = Math.min(15, 3 + aIdx * 2);
          const expSal = Math.round((rConf.marketSalaryMin + (aIdx / 6) * (rConf.marketSalaryMax - rConf.marketSalaryMin)) * 10) / 10;
          const location = LOCATIONS[(aIdx * 2 + rIdx + 1) % LOCATIONS.length];
          const avail = 15 + aIdx * 10;
          
          const skillsMap = {};
          for (const sk of rConf.primarySkills) {
            skillsMap[sk] = Math.min(95, Math.round(80 + (aIdx % 15)));
          }

          const personId = crypto.createHash('sha256').update(`${ownerId}\0candidate\0${externalId}`).digest('hex');
          const payload = {
            id: personId,
            sourceId: batchId,
            externalId,
            name,
            kind: 'candidate',
            role: rConf.role,
            company: 'Market Applicant',
            level: exp < 5 ? 'Mid' : exp < 9 ? 'Senior' : 'Lead',
            location,
            experience: exp,
            salary: expSal,
            rate: 0,
            availability: avail,
            performance: 80,
            learning: 80,
            promotionEligible: false,
            skills: skillsMap,
            projects: [`Candidate Portfolio: ${rConf.role}`],
            certifications: [`Certified ${rConf.primarySkills[0]}`],
            conversionInterest: 'Yes'
          };

          allTalentRecords.push({ id: personId, externalId, kind: 'candidate', payload });
        }
      }

      // Batch insert into talent_records
      const BATCH_SIZE = 200;
      for (let i = 0; i < allTalentRecords.length; i += BATCH_SIZE) {
        const slice = allTalentRecords.slice(i, i + BATCH_SIZE);
        const values = [];
        const params = [];
        let pIndex = 1;

        for (const item of slice) {
          values.push(`($${pIndex}, $${pIndex+1}, $${pIndex+2}, $${pIndex+3}, $${pIndex+4}, $${pIndex+5})`);
          params.push(item.id, ownerId, item.externalId, item.kind, JSON.stringify(item.payload), batchId);
          pIndex += 6;
        }

        await client.query(`
          INSERT INTO talent_records (id, owner_id, external_id, kind, payload, batch_id)
          VALUES ${values.join(', ')}
          ON CONFLICT (owner_id, kind, external_id) DO UPDATE 
          SET payload = EXCLUDED.payload, batch_id = EXCLUDED.batch_id
        `, params);
      }

      console.log(`Inserted ${allTalentRecords.length} talent records successfully for ${user.email}.`);

      // 5. Generate 12 Requirements (6 Approved, 5 Awaiting review, 1 Rejected)
      console.log('Generating 12 workforce requirements with deterministic analyses...');

      const REQUIREMENTS_DEF = [
        {
          id: 'REQ-2026-001',
          role: 'Senior Full Stack Engineer',
          headcount: 2,
          budget: 32, // 32 LPA
          deadline: 45,
          location: 'Bengaluru',
          priority: 'High',
          status: 'Approved',
          selectedStrategy: 'BUILD',
          skills: { 'React': 30, 'Node.js': 25, 'TypeScript': 20, 'PostgreSQL': 15, 'GraphQL': 10 },
          expMin: 5, expMax: 12,
          decisionComment: 'Approved BUILD strategy. Internal engineering bench in Bengaluru possesses strong core TypeScript/React foundation. 14-day upskilling in GraphQL covers all capability gaps at lower cost and faster operational delivery than external hire.'
        },
        {
          id: 'REQ-2026-002',
          role: 'Cloud DevOps Engineer',
          headcount: 3,
          budget: 28,
          deadline: 35,
          location: 'Hyderabad',
          priority: 'Critical',
          status: 'Approved',
          selectedStrategy: 'BUILD + BORROW',
          skills: { 'AWS': 30, 'Docker': 25, 'Kubernetes': 25, 'Terraform': 20 },
          expMin: 4, expMax: 10,
          decisionComment: 'Approved BUILD + BORROW hybrid delivery. Mobilizing 2 internal cloud engineers with Kubernetes certification plus 1 contingent specialist for immediate sprint surge allows target deadline completion within budget limits.'
        },
        {
          id: 'REQ-2026-003',
          role: 'Data Engineer',
          headcount: 2,
          budget: 26,
          deadline: 60,
          location: 'Pune',
          priority: 'Standard',
          status: 'Approved',
          selectedStrategy: 'BUILD',
          skills: { 'Python': 30, 'Apache Spark': 30, 'SQL': 20, 'Snowflake': 20 },
          expMin: 3, expMax: 8,
          decisionComment: 'Approved BUILD allocation. The 60-day project horizon comfortably accommodates internal data warehouse training in Snowflake while saving ~₹14L in recruitment headhunting fees.'
        },
        {
          id: 'REQ-2026-004',
          role: 'AI / Machine Learning Engineer',
          headcount: 1,
          budget: 42,
          deadline: 40,
          location: 'Bengaluru',
          priority: 'Critical',
          status: 'Approved',
          selectedStrategy: 'BUY',
          skills: { 'Python': 25, 'PyTorch': 35, 'MLOps': 25, 'NLP': 15 },
          expMin: 5, expMax: 10,
          decisionComment: 'Approved BUY strategy. Specialized generative model inference and fine-tuning expertise is required immediately. Internal upskilling lag exceeds the target SLA.'
        },
        {
          id: 'REQ-2026-005',
          role: 'Platform Security Engineer',
          headcount: 2,
          budget: 32,
          deadline: 25,
          location: 'Chennai',
          priority: 'High',
          status: 'Approved',
          selectedStrategy: 'BORROW',
          skills: { 'Cloud Security': 35, 'IAM': 25, 'Kubernetes Security': 25, 'SIEM': 15 },
          expMin: 4, expMax: 9,
          decisionComment: 'Approved BORROW strategy. Urgent security audit and hardening requirement (25-day deadline). Certified external consultants can deploy within 7 days.'
        },
        {
          id: 'REQ-2026-006',
          role: 'UI/UX Product Designer',
          headcount: 2,
          budget: 22,
          deadline: 40,
          location: 'Delhi NCR',
          priority: 'Standard',
          status: 'Approved',
          selectedStrategy: 'RELOCATE',
          skills: { 'Figma': 35, 'Design Systems': 30, 'Usability Testing': 20, 'Wireframing': 15 },
          expMin: 3, expMax: 8,
          decisionComment: 'Approved RELOCATE / Remote approach. High availability of strong product designers across Pune and Remote hubs delivers equal quality with 24% annual budget savings.'
        },
        {
          id: 'REQ-2026-007',
          role: 'MLOps Engineer',
          headcount: 2,
          budget: 34,
          deadline: 40,
          location: 'Bengaluru',
          priority: 'High',
          status: 'Awaiting review',
          skills: { 'Kubeflow': 30, 'MLflow': 25, 'Docker': 25, 'Python': 20 },
          expMin: 4, expMax: 9
        },
        {
          id: 'REQ-2026-008',
          role: 'Site Reliability Engineer (SRE)',
          headcount: 2,
          budget: 28,
          deadline: 30,
          location: 'Hyderabad',
          priority: 'Critical',
          status: 'Awaiting review',
          skills: { 'Linux': 30, 'Prometheus': 25, 'Grafana': 25, 'Incident Management': 20 },
          expMin: 4, expMax: 9
        },
        {
          id: 'REQ-2026-009',
          role: 'QA Automation Engineer',
          headcount: 3,
          budget: 18,
          deadline: 30,
          location: 'Pune',
          priority: 'Standard',
          status: 'Awaiting review',
          skills: { 'Playwright': 35, 'Cypress': 25, 'Selenium': 20, 'Java': 20 },
          expMin: 2, expMax: 7
        },
        {
          id: 'REQ-2026-010',
          role: 'Product Manager',
          headcount: 1,
          budget: 32,
          deadline: 45,
          location: 'Bengaluru',
          priority: 'High',
          status: 'Awaiting review',
          skills: { 'Product Strategy': 35, 'Agile Methodologies': 25, 'User Research': 20, 'Roadmapping': 20 },
          expMin: 5, expMax: 10
        },
        {
          id: 'REQ-2026-011',
          role: 'Backend Go Engineer',
          headcount: 2,
          budget: 28,
          deadline: 35,
          location: 'Remote',
          priority: 'Standard',
          status: 'Awaiting review',
          skills: { 'Go': 35, 'Microservices': 25, 'gRPC': 20, 'Docker': 20 },
          expMin: 3, expMax: 8
        },
        {
          id: 'REQ-2026-012',
          role: 'Cybersecurity Analyst',
          headcount: 2,
          budget: 16,
          deadline: 15,
          location: 'Delhi NCR',
          priority: 'Standard',
          status: 'Rejected',
          selectedStrategy: 'BUY',
          skills: { 'Vulnerability Assessment': 35, 'Network Security': 25, 'SOC Operations': 25, 'Compliance': 15 },
          expMin: 2, expMax: 6,
          decisionComment: 'Rejected proposal. 15-day timeline is unachievable for permanent hiring; budgeted rate of ₹16 LPA is below competitive Chennai/Delhi talent expectations.'
        }
      ];

      const stageNames = [
        'Requirement intake', 'Evidence collection', 'Skill normalization', 'Requirement analysis',
        'Internal talent', 'Contractor capacity', 'External market', 'Location comparison',
        'Automation feasibility', 'Strategy scoring', 'Explanation & evidence', 'Dashboard update',
        'Human decision', 'Action execution'
      ];

      const createdDecisions = [];
      const createdActions = [];
      const reservedPersonIds = [];

      for (const reqDef of REQUIREMENTS_DEF) {
        const reqId = (user.email === 'rajatharun12@gmail.com') ? reqDef.id : `${reqDef.id}-${user.id.slice(0, 4)}`;
        const createdAt = new Date(Date.now() - 30 * 86400000 + Math.random() * 20 * 86400000).toISOString();
        const mandatorySkills = Object.keys(reqDef.skills);

        // Fetch matching employees for analysis snapshot
        const roleEmployees = employeesByRole[reqDef.role] || [];
        const topInternalMatches = roleEmployees.slice(0, reqDef.headcount + 3).map((p, idx) => ({
          ...p,
          match: 85 - idx * 4,
          skillMatch: 88 - idx * 3,
          missing: [],
          trainingDays: 0,
          trainingCost: 0,
          trainingKnown: true,
          readyDays: p.availability,
          suitable: true,
          breakdown: { 'Skill match': 88, Experience: 95, Performance: p.performance, Learning: p.learning, Availability: 90, Promotion: 100 }
        }));

        const analysis = {
          internal: topInternalMatches,
          contractors: [],
          candidates: [],
          ranking: [
            { strategy: 'BUILD', score: 86.4, cost: Math.round(reqDef.headcount * reqDef.budget * 100000 * 0.75), days: 25, coverage: reqDef.headcount, risk: 22, viable: true, criteria: { 'Skill match': 88, Availability: 85, 'Training time': 80, Performance: 88, 'Cost saving': 90 }, weights: { 'Skill match': 0.3, Availability: 0.2, 'Training time': 0.2, Performance: 0.15, 'Cost saving': 0.15 }, evidence: ['HRIS Master Export 2026', 'Planning assumptions'], caveat: 'Forecast using imported observations and disclosed planning assumptions.' },
            { strategy: 'BORROW', score: 81.2, cost: Math.round(reqDef.headcount * 2400 * 160 * 6), days: 10, coverage: reqDef.headcount, risk: 28, viable: true, criteria: { 'Skill match': 85, Availability: 95, Cost: 72, Performance: 85 }, weights: { 'Skill match': 0.35, Availability: 0.25, Cost: 0.2, Performance: 0.2 }, evidence: ['Contractor VMS Benchmark'], caveat: 'External contractor surge; rate based on 160 hrs/month.' },
            { strategy: 'BUY', score: 76.5, cost: Math.round(reqDef.headcount * reqDef.budget * 100000 * 1.08), days: 45, coverage: reqDef.headcount, risk: 36, viable: true, criteria: { 'Skill match': 82, Cost: 75, Time: 70, Availability: 75, Retention: 65 }, weights: { 'Skill match': 0.3, Cost: 0.2, Time: 0.2, Availability: 0.15, Retention: 0.15 }, evidence: ['ATS Candidate Pipeline'], caveat: 'Recruitment assumes 8% agency placement fee.' },
            { strategy: 'RELOCATE', score: 74.0, cost: Math.round(reqDef.headcount * reqDef.budget * 100000 * 0.85), days: 38, coverage: reqDef.headcount, risk: 32, viable: true, criteria: { 'Skill match': 80, Cost: 85, Time: 75, Availability: 75, 'Remote suitability': 80 }, weights: { 'Skill match': 0.3, Cost: 0.25, Time: 0.2, Availability: 0.15, 'Remote suitability': 0.1 }, evidence: ['Location cost comparison'], caveat: 'Assumes relocation or remote hiring.' },
            { strategy: 'AUTOMATE', score: 58.0, cost: 550000, days: 45, coverage: Math.floor(reqDef.headcount * 0.4), risk: 42, viable: false, criteria: { 'Task suitability': 30, Cost: 70, Time: 65, 'Business impact': 30, 'Delivery safety': 58 }, weights: { 'Task suitability': 0.35, Cost: 0.2, Time: 0.2, 'Business impact': 0.15, 'Delivery safety': 0.1 }, evidence: ['Task automation analysis'], caveat: 'Repetitive task ratio is below full automation viability threshold.' }
          ],
          recommendation: reqDef.selectedStrategy || 'BUILD',
          confidence: 88,
          hybrid: {
            name: 'Internal + contractors',
            strategy: 'BUILD + BORROW',
            headcount: reqDef.headcount,
            budget: reqDef.budget,
            deadline: reqDef.deadline,
            location: reqDef.location,
            buildCount: Math.ceil(reqDef.headcount * 0.6),
            durationMonths: 12,
            repetitivePct: 0,
            cost: Math.round(reqDef.headcount * reqDef.budget * 100000 * 0.82),
            days: 20,
            coverage: reqDef.headcount,
            risk: 24,
            score: 84.5,
            budgetDifference: Math.round(reqDef.budget * 100000 * reqDef.headcount * 0.18),
            timelineDifference: reqDef.deadline - 20,
            feasible: true,
            notes: [`${Math.ceil(reqDef.headcount * 0.6)} internal employees and ${reqDef.headcount - Math.ceil(reqDef.headcount * 0.6)} contractors cover ${reqDef.headcount} positions.`]
          },
          locations: LOCATIONS.map(city => ({
            city,
            cost: Math.round(reqDef.headcount * reqDef.budget * 100000 * (city === 'Bengaluru' ? 1.0 : city === 'Hyderabad' ? 0.92 : city === 'Pune' ? 0.88 : 0.82)),
            days: 35,
            coverage: reqDef.headcount,
            score: city === reqDef.location ? 84 : 76,
            salary: null,
            costIndex: null
          })),
          normalization: mandatorySkills.map(s => ({ input: s, normalized: s, confidence: 100, method: 'Dictionary' })),
          questions: [
            `Does the work require presence in ${reqDef.location}?`,
            'Can seniority be optimized with targeted mentoring?',
            'Which internal responsibilities would require backfilling?'
          ],
          explanation: [
            `${reqDef.selectedStrategy || 'BUILD'} is the recommended strategy under current workforce evidence and project constraints.`,
            `${topInternalMatches.length} qualified internal professionals meet technical readiness benchmarks.`,
            'Decision rationale reflects verified skill proficiencies, historical delivery performance, and budget targets.'
          ]
        };

        const defaultWeights = {
          BUILD: { 'Skill match': 0.3, Availability: 0.2, 'Training time': 0.2, Performance: 0.15, 'Cost saving': 0.15 },
          BUY: { 'Skill match': 0.3, Cost: 0.2, Time: 0.2, Availability: 0.15, Retention: 0.15 },
          BORROW: { 'Skill match': 0.35, Availability: 0.25, Cost: 0.2, Performance: 0.2 },
          AUTOMATE: { 'Task suitability': 0.35, Cost: 0.2, Time: 0.2, 'Business impact': 0.15, 'Delivery safety': 0.1 },
          RELOCATE: { 'Skill match': 0.3, Cost: 0.25, Time: 0.2, Availability: 0.15, 'Remote suitability': 0.1 }
        };

        const stages = stageNames.map((name, idx) => ({
          name,
          state: reqDef.status === 'Approved' ? 'Completed' : reqDef.status === 'Rejected' && idx >= 12 ? 'Failed' : idx < 12 ? 'Completed' : 'Waiting',
          note: idx === 12 ? (reqDef.status === 'Approved' ? `Approved by ${user.name}` : reqDef.status === 'Rejected' ? `Rejected by ${user.name}` : 'Awaiting reviewer decision') : idx === 13 ? (reqDef.status === 'Approved' ? 'Execution actions active in Action tracker' : 'No execution') : 'Computed and persisted.'
        }));

        const requirementPayload = {
          id: reqId,
          ownerId,
          role: reqDef.role,
          headcount: reqDef.headcount,
          budget: reqDef.budget,
          deadline: reqDef.deadline,
          location: reqDef.location,
          experienceMin: reqDef.expMin,
          experienceMax: reqDef.expMax,
          mandatorySkills,
          optionalSkills: [],
          skillWeights: reqDef.skills,
          businessUnit: 'Core Technology',
          priority: reqDef.priority,
          durationMonths: 12,
          repetitivePct: 15,
          remoteAllowed: reqDef.location === 'Remote',
          rawText: `Looking for ${reqDef.headcount} ${reqDef.role} in ${reqDef.location} with budget ₹${reqDef.budget} LPA within ${reqDef.deadline} days.`,
          status: reqDef.status,
          createdAt,
          analysis,
          weights: defaultWeights,
          stages
        };

        // Insert into requirements
        await client.query(`
          INSERT INTO requirements (id, owner_id, role, headcount, budget, deadline, status, payload, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        `, [reqId, ownerId, reqDef.role, reqDef.headcount, reqDef.budget, reqDef.deadline, reqDef.status, JSON.stringify(requirementPayload), createdAt]);

        // Insert requirement_skills
        for (const [skName, weight] of Object.entries(reqDef.skills)) {
          await client.query(`
            INSERT INTO requirement_skills (requirement_id, raw_name, importance, mandatory)
            VALUES ($1, $2, $3, true)
            ON CONFLICT (requirement_id, raw_name) DO NOTHING
          `, [reqId, skName, weight]);
        }

        // Insert strategy_scores
        for (const strat of analysis.ranking) {
          await client.query(`
            INSERT INTO strategy_scores (requirement_id, strategy, score, breakdown_json, weights_json)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (requirement_id, strategy) DO NOTHING
          `, [reqId, strat.strategy, strat.score, JSON.stringify(strat.criteria), JSON.stringify(strat.weights)]);
        }

        // Saved scenarios in scenarios table
        const sc1Id = crypto.randomUUID();
        const sc1Payload = {
          id: sc1Id,
          requirementId: reqId,
          name: 'Internal development',
          strategy: 'BUILD',
          headcount: reqDef.headcount,
          budget: reqDef.budget,
          deadline: reqDef.deadline,
          location: reqDef.location,
          buildCount: reqDef.headcount,
          durationMonths: 12,
          repetitivePct: 0,
          cost: Math.round(reqDef.headcount * reqDef.budget * 100000 * 0.74),
          days: 22,
          coverage: reqDef.headcount,
          risk: 21.0,
          score: 87.2,
          budgetDifference: Math.round(reqDef.budget * 100000 * reqDef.headcount * 0.26),
          timelineDifference: reqDef.deadline - 22,
          feasible: true,
          notes: [`${reqDef.headcount} internal employees cover ${reqDef.headcount} positions.`]
        };

        const sc2Id = crypto.randomUUID();
        const sc2Payload = {
          id: sc2Id,
          requirementId: reqId,
          name: 'External recruitment',
          strategy: 'BUY',
          headcount: reqDef.headcount,
          budget: reqDef.budget,
          deadline: reqDef.deadline,
          location: reqDef.location,
          buildCount: 0,
          durationMonths: 12,
          repetitivePct: 0,
          cost: Math.round(reqDef.headcount * reqDef.budget * 100000 * 1.08),
          days: 42,
          coverage: reqDef.headcount,
          risk: 34.0,
          score: 75.8,
          budgetDifference: -Math.round(reqDef.budget * 100000 * reqDef.headcount * 0.08),
          timelineDifference: reqDef.deadline - 42,
          feasible: reqDef.deadline >= 42,
          notes: ['External market recruiting including 8% standard recruitment agency fees.']
        };

        await client.query(`
          INSERT INTO scenarios (id, requirement_id, name, inputs_json, cost, time_days, risk, payload, created_at)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9),
            ($10, $2, $11, $12, $13, $14, $15, $16, $9)
        `, [
          sc1Id, reqId, sc1Payload.name, JSON.stringify(sc1Payload), sc1Payload.cost, sc1Payload.days, sc1Payload.risk, JSON.stringify(sc1Payload), createdAt,
          sc2Id, sc2Payload.name, JSON.stringify(sc2Payload), sc2Payload.cost, sc2Payload.days, sc2Payload.risk, JSON.stringify(sc2Payload)
        ]);

        // If Approved or Rejected, create Decision record & Decision Audit
        if (reqDef.status === 'Approved' || reqDef.status === 'Rejected') {
          const decisionId = crypto.randomUUID();
          const decisionCreatedAt = new Date(Date.parse(createdAt) + 3600000).toISOString();

          const decisionPayload = {
            id: decisionId,
            requirementId: reqId,
            actor: user.name,
            outcome: reqDef.status,
            original: reqDef.selectedStrategy,
            selected: reqDef.selectedStrategy,
            comment: reqDef.decisionComment,
            createdAt: decisionCreatedAt,
            weights: defaultWeights,
            snapshot: sc1Payload,
            sourcingOnly: false
          };

          await client.query(`
            INSERT INTO decisions (id, requirement_id, decided_by, decision, comment, payload, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [decisionId, reqId, ownerId, reqDef.status, reqDef.decisionComment, JSON.stringify(decisionPayload), decisionCreatedAt]);

          await client.query(`
            INSERT INTO decision_audit (id, requirement_id, decision_id, actor, event, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [crypto.randomUUID(), reqId, decisionId, user.name, JSON.stringify(decisionPayload), decisionCreatedAt]);

          createdDecisions.push({ ...decisionPayload, role: reqDef.role, location: reqDef.location, headcount: reqDef.headcount });

          // If Approved, create Actions and Capacity Reservations
          if (reqDef.status === 'Approved') {
            const strat = reqDef.selectedStrategy;
            const actionTitles = {
              'BUILD': 'Enrol employees in an upskilling plan',
              'BUY': 'Open a recruitment requisition',
              'BORROW': 'Create a contractor engagement',
              'AUTOMATE': 'Start an automation feasibility initiative',
              'RELOCATE': 'Create a location and remote-work plan',
              'BUILD + BORROW': 'Enrol employees in an upskilling plan'
            };

            // Select 1-2 actual employees or contractors to reserve
            const targetPeopleToReserve = strat.includes('BUILD') 
              ? roleEmployees.slice(0, strat === 'BUILD + BORROW' ? 2 : reqDef.headcount)
              : strat === 'BORROW' 
              ? allTalentRecords.filter(t => t.kind === 'contractor' && t.payload.role === reqDef.role).slice(0, reqDef.headcount).map(t => t.payload)
              : [];

            for (const person of targetPeopleToReserve) {
              await client.query(`
                INSERT INTO resource_reservations (person_id, requirement_id, created_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (person_id) DO NOTHING
              `, [person.id, reqId, decisionCreatedAt]);

              reservedPersonIds.push({ personId: person.id, reqId, name: person.name, role: person.role });
            }

            const actionId = crypto.randomUUID();
            const actionStatus = reqDef.id === 'REQ-2026-001' ? 'Completed' : reqDef.id === 'REQ-2026-002' ? 'In Progress' : 'Pending';
            
            const actionPayload = {
              id: actionId,
              requirementId: reqId,
              decisionId,
              strategy: strat.includes('BUILD') ? 'BUILD' : strat,
              title: actionTitles[strat] || 'Execute workforce plan',
              owner: user.name,
              status: actionStatus,
              createdAt: decisionCreatedAt,
              history: [
                { status: 'Pending', at: decisionCreatedAt, actor: user.name, note: 'Work item created from approved decision.' },
                ...(actionStatus !== 'Pending' ? [{ status: actionStatus, at: new Date(Date.parse(decisionCreatedAt) + 86400000).toISOString(), actor: user.name, note: actionStatus === 'Completed' ? 'Upskilling program successfully completed with verifiable certificate.' : 'Course modules actively progressing in LMS.' }] : [])
              ],
              details: {
                headcount: reqDef.headcount,
                personIds: targetPeopleToReserve.map(p => p.id),
                missingSkills: [],
                location: reqDef.location,
                source: 'Approved workforce work item'
              }
            };

            await client.query(`
              INSERT INTO actions (id, requirement_id, decision_id, strategy, type, status, owner_name, payload, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [actionId, reqId, decisionId, actionPayload.strategy, actionPayload.title, actionStatus, user.name, JSON.stringify(actionPayload), decisionCreatedAt]);

            await client.query(`
              INSERT INTO action_history (id, action_id, actor, status, note, created_at)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [crypto.randomUUID(), actionId, user.name, 'Pending', 'Created from approved decision.', decisionCreatedAt]);

            if (actionStatus !== 'Pending') {
              await client.query(`
                INSERT INTO action_history (id, action_id, actor, status, note, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
              `, [crypto.randomUUID(), actionId, user.name, actionStatus, actionStatus === 'Completed' ? 'Upskilling verified.' : 'In progress.', new Date(Date.parse(decisionCreatedAt) + 86400000).toISOString()]);
            }

            createdActions.push(actionPayload);
          }
        }
      }

      console.log(`Requirements, decisions (${createdDecisions.length}), actions (${createdActions.length}), and reservations (${reservedPersonIds.length}) created.`);

      // 6. Workforce Memory: Workforce Outcomes & Course Events
      console.log('Seeding workforce outcomes and learning evidence...');
      const approvedDecisions = createdDecisions.filter(d => d.outcome === 'Approved');

      for (let dIdx = 0; dIdx < approvedDecisions.length; dIdx++) {
        const dec = approvedDecisions[dIdx];
        const observedAt = new Date(Date.now() - (15 - dIdx * 2) * 86400000).toISOString().slice(0, 10);
        const actualCost = Math.round(dec.snapshot.cost * (0.95 + (dIdx % 3) * 0.05));
        const actualDays = Math.round(dec.snapshot.days * (0.90 + (dIdx % 2) * 0.15));

        const outcomeId = crypto.randomUUID();
        const outcomePayload = {
          id: outcomeId,
          decisionId: dec.id,
          requirementId: dec.requirementId,
          role: dec.role,
          city: dec.location,
          headcount: dec.headcount,
          durationMonths: 12,
          strategy: dec.selected,
          observedAt,
          createdAt: new Date().toISOString(),
          actor: user.name,
          successful: true,
          retained: true,
          deliveredOnTime: actualDays <= dec.snapshot.days,
          predictedCost: dec.snapshot.cost,
          predictedDays: dec.snapshot.days,
          baseCost: dec.snapshot.cost,
          baseDays: dec.snapshot.days,
          actualCost,
          actualDays,
          courses: [
            { name: `Advanced ${dec.role} Foundations`, provider: 'Microsoft Learn', completed: true, evidence: 'Microsoft Learn Verified Badge ML-2026-88' },
            { name: 'Cloud Native Delivery Masterclass', provider: 'Coursera', completed: true, evidence: 'Certificate credential id CRT-COURSERA-4491' }
          ],
          evidence: `Retrospective evaluation for ${dec.role} in ${dec.location}: Delivered production capabilities within ₹${(actualCost/100000).toFixed(1)}L cost envelope and ${actualDays} days readiness.`
        };

        await client.query(`
          INSERT INTO workforce_outcomes (id, owner_id, decision_id, payload, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [outcomeId, ownerId, dec.id, JSON.stringify(outcomePayload), new Date().toISOString()]);

        // Course Events for LMS verification tab
        const eventId = crypto.randomUUID();
        const courseEventPayload = {
          id: eventId,
          eventId: `CE-${dIdx + 1}`,
          decisionId: dec.id,
          personId: reservedPersonIds[dIdx]?.personId || 'EMP-00001',
          courseId: `MS-LEARN-${100 + dIdx}`,
          name: `Official Microsoft Learn Track: ${dec.role}`,
          provider: 'Microsoft Learn',
          completed: true,
          observedAt: new Date(Date.now() - (20 - dIdx * 2) * 86400000).toISOString(),
          receivedAt: new Date().toISOString(),
          channel: 'reviewer import',
          evidence: `Verified completion transcript for learner in ${dec.role}`
        };

        await client.query(`
          INSERT INTO course_events (id, owner_id, decision_id, event_key, payload, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (owner_id, event_key) DO NOTHING
        `, [eventId, ownerId, dec.id, `course-ev-${dec.id}-${dIdx}`, JSON.stringify(courseEventPayload), new Date().toISOString()]);
      }

      // 7. Pay Policies for Fair Pay & City Budgets
      console.log('Seeding market pay policies across roles and destination cities...');
      const PAY_POLICIES_DEF = [
        { role: 'Senior Full Stack Engineer', company: 'Nexus Labs', level: 'Senior', city: 'Bengaluru', min: 220000, max: 290000, living: 75000, source: '2026 Tech Comp Benchmark Survey (Bengaluru Hub)' },
        { role: 'Cloud DevOps Engineer', company: 'Nexus Labs', level: 'Senior', city: 'Hyderabad', min: 180000, max: 260000, living: 65000, source: 'Internal compensation band approved by HR Compensation Committee' },
        { role: 'Data Engineer', company: 'Nexus Labs', level: 'Mid', city: 'Pune', min: 150000, max: 220000, living: 55000, source: 'Q1 Pune IT Salary Review & Verified Peer Band' },
        { role: 'AI / Machine Learning Engineer', company: 'Nexus Labs', level: 'Senior', city: 'Bengaluru', min: 250000, max: 360000, living: 75000, source: 'Specialized AI/ML Market Compensation Guide 2026' },
        { role: 'Platform Security Engineer', company: 'Nexus Labs', level: 'Senior', city: 'Chennai', min: 190000, max: 270000, living: 60000, source: 'Cybersecurity Guild Compensation Benchmark' },
        { role: 'UI/UX Product Designer', company: 'Nexus Labs', level: 'Mid', city: 'Delhi NCR', min: 140000, max: 200000, living: 65000, source: 'Product Design Leadership Guild 2026' },
        { role: 'Backend Go Engineer', company: 'Nexus Labs', level: 'Senior', city: 'Bengaluru', min: 200000, max: 280000, living: 75000, source: 'Distributed Systems & Go Engineers Compensation Grid' },
        { role: 'Site Reliability Engineer (SRE)', company: 'Nexus Labs', level: 'Senior', city: 'Hyderabad', min: 190000, max: 270000, living: 65000, source: 'SRE / DevOps Peer Band Hyderabad' }
      ];

      for (const pDef of PAY_POLICIES_DEF) {
        const polId = crypto.randomUUID();
        const polPayload = {
          id: polId,
          company: pDef.company,
          role: pDef.role,
          level: pDef.level,
          city: pDef.city,
          monthlyMin: pDef.min,
          monthlyMax: pDef.max,
          livingBudget: pDef.living,
          source: pDef.source,
          observedAt: '2026-03-01',
          createdAt: new Date().toISOString()
        };

        await client.query(`
          INSERT INTO pay_policies (id, owner_id, payload, created_at)
          VALUES ($1, $2, $3, $4)
        `, [polId, ownerId, JSON.stringify(polPayload), new Date().toISOString()]);
      }

      // 8. Recruitment Section Data (Profiles, Requisitions, Pipeline, Channels)
      console.log('Seeding talent profiles, recruitment jobs, and pipeline applications...');
      const createdProfiles = [];
      const PROFILES_DEF = [
        { name: 'Aditya Kashyap', role: 'AI / Machine Learning Engineer', location: 'Bengaluru', kind: 'candidate', exp: 6, sal: 38, skills: ['Python', 'PyTorch', 'MLOps', 'Transformers'], channel: 'LinkedIn' },
        { name: 'Rohan Deshmukh', role: 'AI / Machine Learning Engineer', location: 'Bengaluru', kind: 'candidate', exp: 7, sal: 42, skills: ['Python', 'TensorFlow', 'PyTorch', 'NLP'], channel: 'Direct referral' },
        { name: 'Simran Bajaj', role: 'Senior Full Stack Engineer', location: 'Bengaluru', kind: 'candidate', exp: 8, sal: 32, skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'], channel: 'Naukri' },
        { name: 'Pranav Kulkarni', role: 'Cloud DevOps Engineer', location: 'Hyderabad', kind: 'candidate', exp: 5, sal: 25, skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker'], channel: 'LinkedIn' },
        { name: 'Ananya Singhania', role: 'UI/UX Product Designer', location: 'Delhi NCR', kind: 'candidate', exp: 4, sal: 20, skills: ['Figma', 'Design Systems', 'Usability Testing'], channel: 'Career Portal' },
        { name: 'Vikramaditya Roy', role: 'Platform Security Engineer', location: 'Chennai', kind: 'contractor', exp: 6, sal: 0, rate: 2600, skills: ['Cloud Security', 'IAM', 'Kubernetes Security'], channel: 'Staffing Agency' },
        { name: 'Kavya Madhavan', role: 'Data Engineer', location: 'Pune', kind: 'candidate', exp: 5, sal: 24, skills: ['Python', 'Apache Spark', 'Snowflake', 'SQL'], channel: 'LinkedIn' },
        { name: 'Arvind Swaminathan', role: 'Backend Go Engineer', location: 'Bengaluru', kind: 'candidate', exp: 7, sal: 30, skills: ['Go', 'Microservices', 'gRPC', 'PostgreSQL'], channel: 'Direct referral' }
      ];

      for (const p of PROFILES_DEF) {
        const profId = crypto.randomUUID();
        const profPayload = {
          id: profId,
          name: p.name,
          role: p.role,
          location: p.location,
          kind: p.kind,
          experience: p.exp,
          availability: 30,
          salary: p.sal,
          rate: p.rate || null,
          skills: p.skills,
          source: `${p.channel} Application`,
          consent: true,
          conversionInterest: 'Yes',
          claimsStatus: 'Self-reported / not assessed',
          evidence: `Consented resume uploaded via recruitment portal on ${new Date().toLocaleDateString('en-IN')}`,
          observedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };

        await client.query(`
          INSERT INTO talent_profiles (id, owner_id, payload, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $4)
        `, [profId, ownerId, JSON.stringify(profPayload), new Date().toISOString()]);

        createdProfiles.push({ ...profPayload, channel: p.channel });
      }

      // Requisitions from Approved Requirements
      const createdJobs = [];
      const buyReqId = (user.email === 'rajatharun12@gmail.com') ? 'REQ-2026-004' : `REQ-2026-004-${user.id.slice(0, 4)}`;
      const fullStackReqId = (user.email === 'rajatharun12@gmail.com') ? 'REQ-2026-001' : `REQ-2026-001-${user.id.slice(0, 4)}`;

      const buyApprovedReq = REQUIREMENTS_DEF.find(r => r.id === 'REQ-2026-004'); // AI / ML Engineer BUY
      const fullStackReq = REQUIREMENTS_DEF.find(r => r.id === 'REQ-2026-001');

      if (buyApprovedReq) {
        const jobId = crypto.randomUUID();
        const jobPayload = {
          id: jobId,
          requirementId: buyReqId,
          title: `Requisition: ${buyApprovedReq.role} (Req ${buyReqId})`,
          company: 'Nexus Labs',
          level: 'Senior',
          location: buyApprovedReq.location,
          headcount: buyApprovedReq.headcount,
          status: 'Open',
          description: `Strategic hiring for ${buyApprovedReq.role}. Seeking proven expertise in PyTorch, MLOps, model deployment, and distributed inference architectures in ${buyApprovedReq.location}.`,
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          openedAt: new Date(Date.now() - 9 * 86400000).toISOString()
        };

        await client.query(`
          INSERT INTO recruitment_jobs (id, owner_id, requirement_id, payload, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [jobId, ownerId, buyReqId, JSON.stringify(jobPayload), jobPayload.createdAt]);

        createdJobs.push(jobPayload);
      }

      if (fullStackReq) {
        const jobId = crypto.randomUUID();
        const jobPayload = {
          id: jobId,
          requirementId: fullStackReqId,
          title: `Requisition: ${fullStackReq.role} (Req ${fullStackReqId})`,
          company: 'Nexus Labs',
          level: 'Senior',
          location: fullStackReq.location,
          headcount: fullStackReq.headcount,
          status: 'Open',
          description: `External pipeline tracking for ${fullStackReq.role} in ${fullStackReq.location}. Core stack: React, TypeScript, Node.js, PostgreSQL.`,
          createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
          openedAt: new Date(Date.now() - 11 * 86400000).toISOString()
        };

        await client.query(`
          INSERT INTO recruitment_jobs (id, owner_id, requirement_id, payload, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [jobId, ownerId, fullStackReqId, JSON.stringify(jobPayload), jobPayload.createdAt]);

        createdJobs.push(jobPayload);
      }

      // Applications in Pipeline with stage history
      if (createdJobs.length > 0) {
        const job1 = createdJobs[0];
        const job2 = createdJobs[1] || createdJobs[0];

        const APPS_DEF = [
          { job: job1, profile: createdProfiles[0], stage: 'Offer', channel: 'LinkedIn' },
          { job: job1, profile: createdProfiles[1], stage: 'Interview', channel: 'Direct referral' },
          { job: job2, profile: createdProfiles[2], stage: 'Hired', channel: 'Naukri', hiredAt: new Date(Date.now() - 2 * 86400000).toISOString() },
          { job: job2, profile: createdProfiles[3], stage: 'Screening', channel: 'LinkedIn' },
          { job: job1, profile: createdProfiles[4], stage: 'Applied', channel: 'Career Portal' }
        ];

        for (const appDef of APPS_DEF) {
          const appId = crypto.randomUUID();
          const appPayload = {
            id: appId,
            jobId: appDef.job.id,
            profileId: appDef.profile.id,
            channel: appDef.channel,
            stage: appDef.stage,
            createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
            hiredAt: appDef.hiredAt || null,
            history: [
              { stage: 'Applied', at: new Date(Date.now() - 8 * 86400000).toISOString(), actor: user.name, note: `Candidate applied via ${appDef.channel}.` },
              ...(appDef.stage !== 'Applied' ? [{ stage: 'Screening', at: new Date(Date.now() - 6 * 86400000).toISOString(), actor: user.name, note: 'Initial resume screening passed technical alignment check.' }] : []),
              ...(appDef.stage === 'Interview' || appDef.stage === 'Offer' || appDef.stage === 'Hired' ? [{ stage: 'Interview', at: new Date(Date.now() - 4 * 86400000).toISOString(), actor: user.name, note: 'Technical bar raiser and architecture panel completed.' }] : []),
              ...(appDef.stage === 'Offer' || appDef.stage === 'Hired' ? [{ stage: 'Offer', at: new Date(Date.now() - 3 * 86400000).toISOString(), actor: user.name, note: 'Executive compensation package extended within benchmark.' }] : []),
              ...(appDef.stage === 'Hired' ? [{ stage: 'Hired', at: new Date(Date.now() - 2 * 86400000).toISOString(), actor: user.name, note: 'Offer accepted. Onboarding schedule confirmed.' }] : [])
            ]
          };

          await client.query(`
            INSERT INTO recruitment_applications (id, owner_id, job_id, profile_id, payload, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (job_id, profile_id) DO NOTHING
          `, [appId, ownerId, appDef.job.id, appDef.profile.id, JSON.stringify(appPayload), appPayload.createdAt]);
        }
      }

      // 9. Normalization Reviews in Governance / Taxonomy
      console.log('Seeding normalization reviews for Skill Taxonomy review queue...');
      const REVIEWS_DEF = [
        { input: 'k8s', status: 'Resolved', resolvedTo: 'Kubernetes' },
        { input: 'reactjs', status: 'Resolved', resolvedTo: 'React' },
        { input: 'golang', status: 'Resolved', resolvedTo: 'Go' },
        { input: 'generative-ai', status: 'Pending', resolvedTo: null },
        { input: 'kafka-streaming', status: 'Pending', resolvedTo: null }
      ];

      for (const rev of REVIEWS_DEF) {
        await client.query(`
          INSERT INTO normalization_reviews (id, owner_id, input, status, resolved_to)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (owner_id, input) DO UPDATE 
          SET status = EXCLUDED.status, resolved_to = EXCLUDED.resolved_to
        `, [crypto.randomUUID(), ownerId, rev.input, rev.status, rev.resolvedTo]);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 WORKFORCE ADVISORY FULL SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');

  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
