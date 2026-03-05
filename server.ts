import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Tentativa de login para: ${username}`);

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .ilike("username", username)
      .eq("password", password)
      .maybeSingle(); // Retorna null se não encontrar, em vez de dar erro

    if (error) {
      console.error("Erro técnico no Supabase durante login:", error.message);
      return res.status(500).json({ error: "Erro interno no servidor de banco de dados" });
    }

    if (user) {
      console.log(`Login bem-sucedido para: ${user.username}`);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      console.log(`Login falhou: Usuário "${username}" não encontrado ou senha incorreta.`);
      res.status(401).json({ error: "Usuário ou senha incorretos" });
    }
  });

  // Users Management
  app.get("/api/users", async (req, res) => {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, role, name, email, image");
    if (error) return res.status(500).json({ error: error.message });
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    const { username, password, role, name, email, image } = req.body;
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, password, role, name, email, image }])
      .select()
      .single();
    
    if (error) return res.status(400).json({ error: "Usuário já existe ou erro no banco" });
    res.json(data);
  });

  app.put("/api/users/:id", async (req, res) => {
    const { username, password, role, name, email, image } = req.body;
    const updateData: any = { username, role, name, email, image };
    if (password) updateData.password = password;
    
    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/users/:id", async (req, res) => {
    console.log(`Tentativa de exclusão de usuário ID: ${req.params.id}`);
    const { error } = await supabase.from("users").delete().eq("id", req.params.id);
    if (error) {
      console.error(`Erro ao excluir usuário ${req.params.id}:`, error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log(`Usuário ID ${req.params.id} excluído com sucesso`);
    res.json({ success: true });
  });

  // Projects Management
  app.get("/api/projects", async (req, res) => {
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("active", true);
    if (error) return res.status(500).json({ error: error.message });
    res.json(projects);
  });

  app.post("/api/projects", async (req, res) => {
    const { name, description } = req.body;
    const { data, error } = await supabase
      .from("projects")
      .insert([{ name, description, active: true }])
      .select()
      .single();
    
    if (error) return res.status(400).json({ error: "Projeto já existe ou erro no banco" });
    res.json(data);
  });

  app.put("/api/projects/:id", async (req, res) => {
    const { name, description } = req.body;
    const { error } = await supabase
      .from("projects")
      .update({ name, description })
      .eq("id", req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/projects/:id", async (req, res) => {
    console.log(`Tentativa de desativação de projeto ID: ${req.params.id}`);
    const { error } = await supabase
      .from("projects")
      .update({ active: false })
      .eq("id", req.params.id);
    if (error) {
      console.error(`Erro ao desativar projeto ${req.params.id}:`, error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log(`Projeto ID ${req.params.id} desativado com sucesso`);
    res.json({ success: true });
  });

  // Time Logs
  app.get("/api/logs", async (req, res) => {
    const { userId, startDate, endDate, role } = req.query;
    
    let query = supabase
      .from("time_logs")
      .select(`
        *,
        projects (name),
        users (name)
      `);

    if (role !== 'admin' && userId) {
      query = query.eq("user_id", userId);
    }

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data: logs, error } = await query.order("date", { ascending: false }).order("id", { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });

    // Flatten the response to match the frontend expectation
    const formattedLogs = logs.map((log: any) => ({
      ...log,
      project_name: log.projects?.name,
      user_name: log.users?.name
    }));

    res.json(formattedLogs);
  });

  app.post("/api/logs", async (req, res) => {
    const { user_id, project_id, date, hours, description } = req.body;
    const { data, error } = await supabase
      .from("time_logs")
      .insert([{ user_id, project_id, date, hours, description }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/logs/:id", async (req, res) => {
    const { project_id, date, hours, description } = req.body;
    const { error } = await supabase
      .from("time_logs")
      .update({ project_id, date, hours, description })
      .eq("id", req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/logs/:id", async (req, res) => {
    console.log(`Tentativa de exclusão de lançamento ID: ${req.params.id}`);
    const { error } = await supabase.from("time_logs").delete().eq("id", req.params.id);
    if (error) {
      console.error(`Erro ao excluir lançamento ${req.params.id}:`, error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log(`Lançamento ID ${req.params.id} excluído com sucesso`);
    res.json({ success: true });
  });

  // Absences Management
  app.get("/api/absences", async (req, res) => {
    const { userId, role } = req.query;
    let query = supabase
      .from("absences")
      .select(`
        *,
        users (name)
      `);

    if (role !== 'admin' && userId) {
      query = query.eq("user_id", userId);
    }

    const { data: absences, error } = await query.order("start_date", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const formattedAbsences = absences.map((abs: any) => ({
      ...abs,
      user_name: abs.users?.name
    }));

    res.json(formattedAbsences);
  });

  app.post("/api/absences", async (req, res) => {
    const { user_id, type, start_date, end_date, description } = req.body;
    const { data, error } = await supabase
      .from("absences")
      .insert([{ user_id, type, start_date, end_date, description }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/absences/:id", async (req, res) => {
    const { type, start_date, end_date, description } = req.body;
    const { error } = await supabase
      .from("absences")
      .update({ type, start_date, end_date, description })
      .eq("id", req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/absences/:id", async (req, res) => {
    const { error } = await supabase.from("absences").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
