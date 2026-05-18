async function doFetch() {
  const contents = [{
    role: "user", 
    parts: [{
      text: "Phase 1: Advanced Data Processing & Lakehouse Architecture\nTask 1: Master Open Table Formats\nSubtask: Deep dive into Delta Lake or Apache Iceberg.\nSubtask: Implement ACID transactions, time travel, and schema evolution directly on object storage.\nTask 2: Optimize Distributed Processing\nSubtask: Master advanced PySpark concepts, specifically handling data skew, partitioning strategies, and optimizing shuffles.  \nSubtask: Build hybrid architectures by integrating real-time event streaming using Apache Kafka or Flink alongside traditional batch jobs.  \nPhase 2: Software Engineering Rigor (Crucial Addition)\nTask 1: Version Control and CI/CD\nSubtask: Enforce strict Git workflows for all pipeline code and infrastructure.\nSubtask: Build CI/CD pipelines (using tools like Azure DevOps or GitHub Actions) to automate testing and code deployment.  \nTask 2: Containerization & Orchestration\nSubtask: Containerize custom data applications and dependencies using Docker.\nSubtask: Manage complex DAGs (Directed Acyclic Graphs), task dependencies, and scheduling using Apache Airflow.  \nPhase 3: Modern ELT & Data Reliability (Crucial Addition)\nTask 1: Modular Transformation & Modeling\nSubtask: Integrate dbt (Data Build Tool) into the workflow for modular, version-controlled SQL transformations.  \nSubtask: Implement strict data modeling patterns, such as Star Schema and Slowly Changing Dimensions (SCD Type 2).\nTask 2: Data Observability & Quality\nSubtask: Establish data contracts between software engineers and data teams to prevent upstream schema changes from breaking downstream pipelines.  \nSubtask: Set up automated data testing and anomaly detection (using frameworks like Great Expectations).\nPhase 4: Cloud Operations, FinOps, & AI Workflows\nTask 1: Cloud Cost Management (FinOps)\nSubtask: Monitor, analyze, and optimize query execution costs within enterprise cloud environments.  \nSubtask: Implement intelligent data retention and compute scaling policies to minimize unnecessary cloud spend.\nTask 2: AI-Assisted Operations & Stakeholder Alignment\nSubtask: Integrate AI agents to rapidly generate boilerplate code, infrastructure scripts, and documentation.\nSubtask: Practice translating technical architecture into clear, bottom-line business value for non-technical stakeholders."
    }]
  }];
  
  const createTaskD = {
    name: "createTask",
    description: "Create a new task.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        priority: { type: "STRING", enum: ["A", "B", "C", "D"], description: "default C" },
        subtasks: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["title", "priority"]
    }
  };

  const config = {
    tools: [{ functionDeclarations: [createTaskD] }],
    temperature: 0.1,
    systemInstruction: "You are an assistant."
  };

  const res = await fetch("http://localhost:3000/api/gemini/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gemini-2.5-flash", contents, config })
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

doFetch();
