import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  Briefcase, 
  Users, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Filter,
  ChevronRight,
  Calendar,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Camera,
  Mail,
  Save,
  Palmtree,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  name: string;
  email?: string;
  image?: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
}

interface TimeLog {
  id: number;
  user_id: number;
  project_id: number;
  date: string;
  hours: number;
  description: string;
  project_name: string;
  user_name: string;
}

interface Absence {
  id: number;
  user_id: number;
  type: string;
  start_date: string;
  end_date: string;
  description: string;
  user_name: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'projects' | 'users' | 'logs' | 'profile' | 'absences'>('dashboard');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Profile State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    image: '',
    password: ''
  });

  // Filters
  const getInitialWeekRange = () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return {
      startDate: sunday.toISOString().split('T')[0],
      endDate: saturday.toISOString().split('T')[0]
    };
  };

  const [filters, setFilters] = useState(getInitialWeekRange());

  // Form States
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'log' | 'project' | 'user', id: number | string, name?: string, data?: any } | null>(null);
  const [logForm, setLogForm] = useState({
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: ''
  });

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '', email: '', role: 'user' as 'admin' | 'user' });
  const [userFormError, setUserFormError] = useState('');
  const [absenceError, setAbsenceError] = useState('');

  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [absenceForm, setAbsenceForm] = useState({
    type: 'Férias',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
      setProfileForm({
        name: user.name,
        email: user.email || '',
        image: user.image || '',
        password: ''
      });
    }
  }, [user, filters, view]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      // dateStr is YYYY-MM-DD
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, lRes, aRes] = await Promise.all([
        fetch('/api/projects'),
        fetch(`/api/logs?userId=${user?.id}&role=${user?.role}&startDate=${filters.startDate}&endDate=${filters.endDate}`),
        fetch(`/api/absences?userId=${user?.id}&role=${user?.role}`)
      ]);
      const pData = await pRes.json();
      const lData = await lRes.json();
      const aData = await aRes.json();

      setProjects(Array.isArray(pData) ? pData : []);
      setLogs(Array.isArray(lData) ? lData : []);
      setAbsences(Array.isArray(aData) ? aData : []);

      if (user?.role === 'admin') {
        const uRes = await fetch('/api/users');
        const uData = await uRes.json();
        setUsers(Array.isArray(uData) ? uData : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setError('Usuário ou senha incorretos');
      }
    } catch (e) {
      setError('Erro ao conectar ao servidor');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  const saveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingLog ? `/api/logs/${editingLog.id}` : '/api/logs';
    const method = editingLog ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logForm,
          user_id: user?.id,
          hours: parseFloat(logForm.hours)
        })
      });
      if (res.ok) {
        setShowLogForm(false);
        setEditingLog(null);
        setLogForm({ project_id: '', date: new Date().toISOString().split('T')[0], hours: '', description: '' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteLog = async (id: number) => {
    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Lançamento excluído com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir lançamento');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao excluir lançamento');
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Projeto desativado com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao desativar projeto');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao desativar projeto');
    }
  };

  const deleteUser = async (u: User) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Usuário excluído com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchData();
      } else {
        const data = await res.json();
        if (data.error?.includes('foreign key constraint')) {
          alert('Não é possível excluir este usuário pois ele possui lançamentos de horas vinculados. Desative o acesso dele alterando a senha ou perfil em vez de excluir.');
        } else {
          alert(data.error || 'Erro ao excluir usuário');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao excluir usuário');
    }
  };

  const handleConfirmDelete = async () => {
    console.log('handleConfirmDelete called', confirmDelete);
    if (!confirmDelete) return;
    
    try {
      if (confirmDelete.type === 'log') {
        await deleteLog(confirmDelete.id as number);
      } else if (confirmDelete.type === 'project') {
        await deleteProject(confirmDelete.id as number);
      } else if (confirmDelete.type === 'user') {
        await deleteUser(confirmDelete.data as User);
      } else if (confirmDelete.type === 'absence') {
        await deleteAbsence(confirmDelete.id as number);
      }
    } catch (error) {
      console.error('Error in handleConfirmDelete:', error);
    } finally {
      setConfirmDelete(null);
    }
  };

  const saveAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    setAbsenceError('');
    const url = editingAbsence ? `/api/absences/${editingAbsence.id}` : '/api/absences';
    const method = editingAbsence ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...absenceForm,
          user_id: user?.id
        })
      });
      if (res.ok) {
        setShowAbsenceForm(false);
        setEditingAbsence(null);
        setAbsenceForm({
          type: 'Férias',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          description: ''
        });
        fetchData();
        setSuccessMessage(editingAbsence ? 'Afastamento atualizado!' : 'Afastamento registrado!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json();
        setAbsenceError(data.error || 'Erro ao salvar afastamento. Verifique se a tabela "absences" existe no Supabase.');
      }
    } catch (e) {
      console.error(e);
      setAbsenceError('Erro de conexão com o servidor.');
    }
  };

  const deleteAbsence = async (id: number) => {
    try {
      const res = await fetch(`/api/absences/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Afastamento excluído com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const editAbsence = (abs: Absence) => {
    setEditingAbsence(abs);
    setAbsenceForm({
      type: abs.type,
      start_date: abs.start_date,
      end_date: abs.end_date,
      description: abs.description
    });
    setShowAbsenceForm(true);
  };

  const copyAbsence = (abs: Absence) => {
    setAbsenceForm({
      type: abs.type,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      description: abs.description
    });
    setEditingAbsence(null);
    setShowAbsenceForm(true);
  };

  const copyLog = (log: TimeLog) => {
    setLogForm({
      project_id: log.project_id.toString(),
      date: new Date().toISOString().split('T')[0],
      hours: log.hours.toString(),
      description: log.description
    });
    setEditingLog(null);
    setShowLogForm(true);
  };

  const editLog = (log: TimeLog) => {
    setEditingLog(log);
    setLogForm({
      project_id: log.project_id.toString(),
      date: log.date,
      hours: log.hours.toString(),
      description: log.description
    });
    setShowLogForm(true);
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
    const method = editingProject ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectForm)
    });
    if (res.ok) {
      setShowProjectForm(false);
      setEditingProject(null);
      setProjectForm({ name: '', description: '' });
      fetchData();
    }
  };

  const copyProject = (project: Project) => {
    setProjectForm({
      name: `${project.name} (Cópia)`,
      description: project.description
    });
    setEditingProject(null);
    setShowProjectForm(true);
  };

  const editProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description
    });
    setShowProjectForm(true);
  };

  const validatePassword = (pass: string, isEdit: boolean = false) => {
    if (!pass && isEdit) return true; // Se estiver editando e não preencher, mantém a atual
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[@$!%*#?&]/.test(pass);
    const hasMinLength = pass.length >= 8;
    return hasLetter && hasNumber && hasSpecial && hasMinLength;
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (profileForm.password && !validatePassword(profileForm.password, true)) {
        setError('A senha deve ter no mínimo 8 caracteres, incluindo letras, números e pelo menos um caractere especial (@$!%*#?&).');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          name: profileForm.name,
          email: profileForm.email,
          image: profileForm.image,
          password: profileForm.password || undefined
        })
      });

      if (res.ok) {
        setSuccessMessage('Perfil atualizado com sucesso!');
        setUser({
          ...user!,
          name: profileForm.name,
          email: profileForm.email,
          image: profileForm.image
        });
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Erro ao atualizar perfil');
      }
    } catch (e) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    if (!validatePassword(userForm.password, !!editingUser)) {
      setUserFormError('A senha deve ter no mínimo 8 caracteres, incluindo letras, números e pelo menos um caractere especial (@$!%*#?&).');
      return;
    }

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm)
    });
    if (res.ok) {
      setShowUserForm(false);
      setEditingUser(null);
      setShowPassword(false);
      setUserForm({ username: '', password: '', name: '', email: '', role: 'user' });
      fetchData();
    } else {
      const data = await res.json();
      setUserFormError(data.error || 'Erro ao salvar usuário');
    }
  };

  const copyUser = (u: User) => {
    setUserForm({
      username: `${u.username}_copy`,
      password: '',
      name: `${u.name} (Cópia)`,
      email: u.email || '',
      role: u.role
    });
    setEditingUser(null);
    setShowUserForm(true);
  };

  const editUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      password: '',
      name: u.name,
      email: u.email || '',
      role: u.role
    });
    setShowUserForm(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-orange-900/5 p-8 border border-orange-100"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4">
              <Clock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">HyperManager</h1>
            <p className="text-stone-500 mt-2">Controle de horas e projetos</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Usuário</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                placeholder="Admin"
                value={loginData.username}
                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Senha</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]"
            >
              Entrar
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Acesso Padrão</p>
            <p className="text-sm text-stone-500 mt-1">Admin / admin</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-stone-200 flex flex-col hidden md:flex">
        <div className="p-5 border-bottom border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/20">
              <Clock className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-stone-900 tracking-tight">HyperManager</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <SidebarItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <SidebarItem 
            icon={<Clock size={18} />} 
            label="Lançamentos" 
            active={view === 'logs'} 
            onClick={() => setView('logs')} 
          />
          <SidebarItem 
            icon={<Palmtree size={18} />} 
            label="Afastamentos" 
            active={view === 'absences'} 
            onClick={() => setView('absences')} 
          />
          {user.role === 'admin' && (
            <>
              <div className="pt-3 pb-1 px-4 text-[9px] font-bold text-stone-400 uppercase tracking-widest">Administração</div>
              <SidebarItem 
                icon={<Briefcase size={18} />} 
                label="Projetos" 
                active={view === 'projects'} 
                onClick={() => setView('projects')} 
              />
              <SidebarItem 
                icon={<Users size={18} />} 
                label="Usuários" 
                active={view === 'users'} 
                onClick={() => setView('users')} 
              />
            </>
          )}
        </nav>

        <div className="p-3 border-t border-stone-100">
          <button 
            onClick={() => setView('profile')}
            className="w-full flex items-center gap-2 p-2 rounded-lg bg-stone-50 mb-2 hover:bg-orange-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-stone-300">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={16} className="text-stone-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-900 truncate">{user.name}</p>
              <p className="text-[10px] text-stone-500 capitalize">{user.role}</p>
            </div>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium text-xs">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-6 z-10 shrink-0">
          <h2 className="text-base font-bold text-stone-900 capitalize">
            {view === 'dashboard' ? 'Visão Geral' : 
             view === 'logs' ? 'Meus Lançamentos' : 
             view === 'projects' ? 'Gerenciar Projetos' : 
             view === 'profile' ? 'Meu Perfil' : 
             view === 'absences' ? 'Afastamentos e Licenças' : 'Gerenciar Usuários'}
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-stone-50 p-1 rounded-lg border border-stone-200">
              <button 
                onClick={() => setFilters(getInitialWeekRange())}
                className="text-[10px] font-bold text-orange-600 hover:bg-orange-100 px-1.5 py-0.5 rounded transition-colors"
                title="Voltar para a semana atual"
              >
                Semana Atual
              </button>
              <div className="w-px h-3 bg-stone-200 mx-0.5"></div>
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-bold px-1.5 py-0.5 outline-none"
                value={filters.startDate}
                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              />
              <span className="text-stone-400 text-[10px]">até</span>
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-bold px-1.5 py-0.5 outline-none"
                value={filters.endDate}
                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            
            {(view === 'logs' || view === 'dashboard' || view === 'absences') && (
              <button 
                onClick={() => {
                  if (view === 'absences') {
                    setEditingAbsence(null);
                    setAbsenceForm({
                      type: 'Férias',
                      start_date: new Date().toISOString().split('T')[0],
                      end_date: new Date().toISOString().split('T')[0],
                      description: ''
                    });
                    setShowAbsenceForm(true);
                  } else {
                    setEditingLog(null);
                    setLogForm({ project_id: '', date: new Date().toISOString().split('T')[0], hours: '', description: '' });
                    setShowLogForm(true);
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
              >
                <Plus size={16} />
                {view === 'absences' ? 'Novo Afastamento' : 'Novo Lançamento'}
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    label="Total de Horas" 
                    value={logs.reduce((acc, log) => acc + log.hours, 0).toFixed(1)} 
                    sub="No período selecionado"
                    icon={<Clock className="text-orange-500" />}
                  />
                  <StatCard 
                    label="Lançamentos" 
                    value={logs.length.toString()} 
                    sub="Registros realizados"
                    icon={<CheckCircle2 className="text-emerald-500" />}
                  />
                  <StatCard 
                    label="Projetos Ativos" 
                    value={projects.length.toString()} 
                    sub="Disponíveis para lançamento"
                    icon={<Briefcase className="text-blue-500" />}
                  />
                  <StatCard 
                    label="Afastamentos" 
                    value={(Array.isArray(absences) ? absences : []).filter(a => {
                      const today = new Date().toISOString().split('T')[0];
                      return today >= a.start_date && today <= a.end_date;
                    }).length.toString()} 
                    sub="Ausentes hoje"
                    icon={<Palmtree className="text-purple-500" />}
                  />
                </div>

                {/* Recent Logs Table */}
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900">Lançamentos Recentes</h3>
                    <button onClick={() => setView('logs')} className="text-orange-500 text-xs font-bold flex items-center gap-1 hover:underline">
                      Ver todos <ChevronRight size={14} />
                    </button>
                  </div>
                  <LogsTable 
                    logs={logs.slice(0, 5)} 
                    onEdit={editLog} 
                    onDelete={(id) => setConfirmDelete({ type: 'log', id })} 
                    onCopy={copyLog} 
                    formatDate={formatDate}
                  />
                </div>
              </motion.div>
            )}

            {view === 'logs' && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm"
              >
                <LogsTable 
                  logs={logs} 
                  onEdit={editLog} 
                  onDelete={(id) => setConfirmDelete({ type: 'log', id })} 
                  onCopy={copyLog} 
                  formatDate={formatDate}
                />
              </motion.div>
            )}

            {view === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 relative">
                    <div className="absolute -bottom-12 left-8">
                      <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                        <div className="w-full h-full rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden relative group">
                          {profileForm.image ? (
                            <img src={profileForm.image} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon size={40} className="text-stone-300" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Camera className="text-white" size={24} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-16 p-8">
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-stone-900">{user.name}</h3>
                      <p className="text-stone-500 text-sm">Gerencie suas informações pessoais</p>
                    </div>

                    <form onSubmit={saveProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Nome Completo</label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input 
                              type="text" 
                              required
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                              value={profileForm.name}
                              onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">E-mail</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input 
                              type="email" 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                              value={profileForm.email}
                              placeholder="seu@email.com"
                              onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">URL da Foto</label>
                          <div className="relative">
                            <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input 
                              type="url" 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                              value={profileForm.image}
                              placeholder="https://exemplo.com/foto.jpg"
                              onChange={e => setProfileForm({ ...profileForm, image: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Nova Senha (opcional)</label>
                          <div className="relative">
                            <Eye className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input 
                              type={showProfilePassword ? "text" : "password"} 
                              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                              value={profileForm.password}
                              placeholder="••••••••"
                              onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowProfilePassword(!showProfilePassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            >
                              {showProfilePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
                          <AlertCircle size={14} />
                          {error}
                        </div>
                      )}

                      {successMessage && (
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                          <CheckCircle2 size={14} />
                          {successMessage}
                        </div>
                      )}

                      <div className="pt-4 flex justify-end">
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <Save size={18} />
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'projects' && (
              <motion.div 
                key="projects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      setEditingProject(null);
                      setProjectForm({ name: '', description: '' });
                      setShowProjectForm(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                  >
                    <Plus size={16} />
                    Novo Projeto
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm max-h-[calc(100vh-220px)] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100">
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Nome do Projeto</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Descrição</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {projects.map(project => (
                        <tr key={project.id} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-stone-50 rounded-lg flex items-center justify-center shrink-0">
                                <Briefcase className="text-stone-400" size={20} />
                              </div>
                              <span className="text-sm font-bold text-stone-900">{project.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-stone-500 line-clamp-1">{project.description || 'Sem descrição'}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => copyProject(project)} 
                                className="p-2 text-stone-400 hover:text-blue-500 transition-colors"
                                title="Copiar"
                              >
                                <Copy size={18} />
                              </button>
                              <button 
                                onClick={() => editProject(project)} 
                                className="p-2 text-stone-400 hover:text-orange-500 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => setConfirmDelete({ type: 'project', id: project.id, name: project.name })} 
                                className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                title="Desativar"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {view === 'absences' && (
              <motion.div 
                key="absences"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      setEditingAbsence(null);
                      setAbsenceForm({
                        type: 'Férias',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date().toISOString().split('T')[0],
                        description: ''
                      });
                      setShowAbsenceForm(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                  >
                    <Plus size={16} />
                    Novo Afastamento
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm max-h-[calc(100vh-220px)] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100">
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Colaborador</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Tipo</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Período</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Descrição</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {(!Array.isArray(absences) || absences.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-stone-400 text-sm italic">
                            Nenhum afastamento registrado.
                          </td>
                        </tr>
                      ) : (
                        absences.map(abs => (
                          <tr key={abs.id} className="hover:bg-stone-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-stone-900">{abs.user_name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                abs.type === 'Férias' ? 'bg-emerald-50 text-emerald-600' :
                                abs.type === 'Recesso' ? 'bg-blue-50 text-blue-600' :
                                'bg-purple-50 text-purple-600'
                              }`}>
                                {abs.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-stone-600 font-medium flex items-center gap-1">
                                <Calendar size={12} className="text-stone-400" />
                                {formatDate(abs.start_date)} - {formatDate(abs.end_date)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-stone-500 line-clamp-1">{abs.description || '-'}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => copyAbsence(abs)} 
                                  className="p-2 text-stone-400 hover:text-blue-500 transition-colors"
                                  title="Copiar"
                                >
                                  <Copy size={18} />
                                </button>
                                <button 
                                  onClick={() => editAbsence(abs)} 
                                  className="p-2 text-stone-400 hover:text-orange-500 transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={() => setConfirmDelete({ type: 'absence', id: abs.id, name: `${abs.type} - ${abs.user_name}` })} 
                                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {view === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      setEditingUser(null);
                      setUserForm({ username: '', password: '', name: '', email: '', role: 'user' });
                      setShowUserForm(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                  >
                    <Plus size={16} />
                    Novo Usuário
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm max-h-[calc(100vh-220px)] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100">
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Nome</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Usuário</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Perfil</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <UserIcon size={20} className="text-stone-400" />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-stone-900">{u.name}</div>
                                <div className="text-[10px] text-stone-500">{u.email || 'Sem e-mail'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-stone-600 font-medium">{u.username}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin' ? 'bg-orange-50 text-orange-600' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => copyUser(u)} 
                                className="p-2 text-stone-400 hover:text-blue-500 transition-colors"
                                title="Copiar"
                              >
                                <Copy size={18} />
                              </button>
                              <button 
                                onClick={() => editUser(u)} 
                                className="p-2 text-stone-400 hover:text-orange-500 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              {u.id !== user?.id && (
                                <button 
                                  onClick={() => setConfirmDelete({ type: 'user', id: u.id, name: u.name, data: u })}
                                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <Modal show={showLogForm} onClose={() => setShowLogForm(false)} title={editingLog ? "Editar Lançamento" : "Novo Lançamento"}>
        <form onSubmit={saveLog} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Projeto</label>
            <select 
              required
              className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
              value={logForm.project_id}
              onChange={e => setLogForm({ ...logForm, project_id: e.target.value })}
            >
              <option value="">Selecione um projeto</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Data</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
                value={logForm.date}
                onChange={e => setLogForm({ ...logForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Horas</label>
              <input 
                type="number" 
                step="0.1"
                required
                className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0.0"
                value={logForm.hours}
                onChange={e => setLogForm({ ...logForm, hours: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Descrição</label>
            <textarea 
              className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
              placeholder="O que você fez?"
              value={logForm.description}
              onChange={e => setLogForm({ ...logForm, description: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20">
            {editingLog ? "Salvar Alterações" : "Lançar Horas"}
          </button>
        </form>
      </Modal>

      <Modal show={showProjectForm} onClose={() => setShowProjectForm(false)} title={editingProject ? "Editar Projeto" : "Novo Projeto"}>
        <form onSubmit={saveProject} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Nome do Projeto</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
              value={projectForm.name}
              onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Descrição</label>
            <textarea 
              className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
              value={projectForm.description}
              onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20">
            {editingProject ? "Salvar Alterações" : "Criar Projeto"}
          </button>
        </form>
      </Modal>

      <Modal show={showUserForm} onClose={() => { setShowUserForm(false); setUserFormError(''); setShowPassword(false); }} title={editingUser ? "Editar Usuário" : "Novo Usuário"}>
        <form onSubmit={saveUser} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
              value={userForm.name}
              onChange={e => setUserForm({ ...userForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">E-mail</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
              value={userForm.email}
              onChange={e => setUserForm({ ...userForm, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Usuário</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
                value={userForm.username}
                onChange={e => setUserForm({ ...userForm, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required={!editingUser}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Perfil</label>
            <select 
              className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
              value={userForm.role}
              onChange={e => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'user' })}
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {userFormError && (
            <div className="text-[10px] text-red-500 bg-red-50 p-2 rounded-lg flex items-start gap-1.5">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <span>{userFormError}</span>
            </div>
          )}
          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20">
            {editingUser ? "Salvar Alterações" : "Criar Usuário"}
          </button>
        </form>
      </Modal>

      <Modal show={showAbsenceForm} onClose={() => setShowAbsenceForm(false)} title={editingAbsence ? "Editar Afastamento" : "Novo Afastamento"}>
        <form onSubmit={saveAbsence} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Tipo de Afastamento</label>
            <select 
              required
              className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
              value={absenceForm.type}
              onChange={e => setAbsenceForm({ ...absenceForm, type: e.target.value })}
            >
              <option value="Férias">Férias</option>
              <option value="Recesso">Recesso</option>
              <option value="Licença Maternidade">Licença Maternidade</option>
              <option value="Licença Paternidade">Licença Paternidade</option>
              <option value="Afastamento">Afastamento</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Início</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
                value={absenceForm.start_date}
                onChange={e => setAbsenceForm({ ...absenceForm, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Término</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500"
                value={absenceForm.end_date}
                onChange={e => setAbsenceForm({ ...absenceForm, end_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Observações</label>
            <textarea 
              className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
              placeholder="Detalhes adicionais..."
              value={absenceForm.description}
              onChange={e => setAbsenceForm({ ...absenceForm, description: e.target.value })}
            />
          </div>
          {absenceError && (
            <div className="text-[10px] text-red-500 bg-red-50 p-2 rounded-lg flex items-start gap-1.5">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <span>{absenceError}</span>
            </div>
          )}
          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20">
            {editingAbsence ? "Salvar Alterações" : "Registrar Afastamento"}
          </button>
        </form>
      </Modal>

      <Modal show={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl text-red-700">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm">
              {confirmDelete?.type === 'log' && (
                <p>Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.</p>
              )}
              {confirmDelete?.type === 'project' && (
                <p>Deseja realmente desativar o projeto <strong>{confirmDelete.name}</strong>? Ele não aparecerá mais para novos lançamentos.</p>
              )}
              {confirmDelete?.type === 'user' && (
                <p>ATENÇÃO: Deseja realmente excluir o usuário <strong>{confirmDelete.name}</strong>? Esta ação removerá o acesso dele permanentemente.</p>
              )}
              {confirmDelete?.type === 'absence' && (
                <p>Deseja realmente excluir este registro de afastamento (<strong>{confirmDelete.name}</strong>)?</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setConfirmDelete(null)}
              className="flex-1 px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmDelete}
              className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
        active 
          ? 'bg-orange-50 text-orange-600 shadow-sm' 
          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
      }`}
    >
      {icon}
      <span className="font-bold text-xs">{label}</span>
    </button>
  );
}

function StatCard({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</span>
        <div className="w-6 h-6 bg-stone-50 rounded flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement, { size: 14 })}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-stone-900">{value}</span>
      </div>
      <p className="text-[10px] text-stone-500 mt-0.5">{sub}</p>
    </div>
  );
}

function LogsTable({ logs, onEdit, onDelete, onCopy, formatDate }: { logs: TimeLog[], onEdit: (l: TimeLog) => void, onDelete: (id: number) => void, onCopy: (l: TimeLog) => void, formatDate: (d: string) => string }) {
  if (logs.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="text-stone-300" size={32} />
        </div>
        <p className="text-stone-500 font-medium">Nenhum lançamento encontrado para este período.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-100">
            <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Data</th>
            <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Projeto</th>
            <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Descrição</th>
            <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Horas</th>
            <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-stone-50/50 transition-colors group">
              <td className="px-4 py-2.5 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-stone-900">{formatDate(log.date)}</span>
                  <span className="text-[9px] text-stone-400 uppercase font-bold">{log.user_name}</span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <span className="px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px] font-bold">{log.project_name}</span>
              </td>
              <td className="px-4 py-2.5">
                <p className="text-xs text-stone-600 line-clamp-1 max-w-xs">{log.description || '-'}</p>
              </td>
              <td className="px-4 py-2.5">
                <span className="text-xs font-bold text-stone-900">{log.hours.toFixed(1)}h</span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-0.5">
                  <button onClick={() => onCopy(log)} className="p-1.5 text-stone-400 hover:text-blue-500 transition-colors" title="Copiar">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => onEdit(log)} className="p-1.5 text-stone-400 hover:text-orange-500 transition-colors" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(log.id)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors" title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ show, onClose, title, children }: { show: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <Plus size={20} className="rotate-45" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
