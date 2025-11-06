// ===============================
// State Management
// ===============================

let currentUser = null;
let tasks = [];
let subManagers = [];

// Load user from localStorage
const savedUser = localStorage.getItem('currentUser');
if (savedUser) {
  currentUser = JSON.parse(savedUser);
}

// ===============================
// API Functions
// ===============================

async function login(username, password) {
  try {
    const response = await axios.post('/api/login', { username, password });
    if (response.data.success) {
      currentUser = response.data.user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  render();
}

async function loadTasks(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.created_by) params.append('created_by', filters.created_by);
    
    const response = await axios.get(`/api/tasks?${params}`);
    tasks = response.data.tasks;
    return tasks;
  } catch (error) {
    console.error('Load tasks error:', error);
    return [];
  }
}

async function loadSubManagers() {
  try {
    const response = await axios.get('/api/users/sub-managers');
    subManagers = response.data.users;
    return subManagers;
  } catch (error) {
    console.error('Load sub-managers error:', error);
    return [];
  }
}

async function createTask(taskData) {
  try {
    const response = await axios.post('/api/tasks', taskData);
    return response.data.success;
  } catch (error) {
    console.error('Create task error:', error);
    return false;
  }
}

async function updateTaskStatus(taskId, status, updateText = '') {
  try {
    const response = await axios.patch(`/api/tasks/${taskId}/status`, {
      status,
      user_id: currentUser.id,
      update_text: updateText
    });
    return response.data.success;
  } catch (error) {
    console.error('Update task error:', error);
    return false;
  }
}

async function addTaskUpdate(taskId, updateText) {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/updates`, {
      user_id: currentUser.id,
      update_text: updateText
    });
    return response.data.success;
  } catch (error) {
    console.error('Add update error:', error);
    return false;
  }
}

async function loadStats() {
  try {
    const response = await axios.get(`/api/stats/${currentUser.id}?role=${currentUser.role}`);
    return response.data.stats;
  } catch (error) {
    console.error('Load stats error:', error);
    return null;
  }
}

async function deleteTask(taskId) {
  try {
    const response = await axios.delete(`/api/tasks/${taskId}`);
    return response.data.success;
  } catch (error) {
    console.error('Delete task error:', error);
    return false;
  }
}

// ===============================
// UI Helper Functions
// ===============================

function getStatusColor(status) {
  const colors = {
    pending: 'bg-amber-100 text-amber-700 border-amber-300',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
    completed: 'bg-gray-100 text-gray-600 border-gray-300',
    blocked: 'bg-rose-100 text-rose-700 border-rose-300'
  };
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-300';
}

function getStatusText(status) {
  const texts = {
    pending: 'ממתין',
    in_progress: 'בתהליך',
    completed: 'הושלם',
    blocked: 'חסום'
  };
  return texts[status] || status;
}

function getPriorityColor(priority) {
  const colors = {
    low: 'bg-slate-500',
    medium: 'bg-amber-500',
    high: 'bg-rose-500',
    urgent: 'bg-purple-500'
  };
  return colors[priority] || 'bg-slate-500';
}

function getPriorityText(priority) {
  const texts = {
    low: 'נמוך',
    medium: 'בינוני',
    high: 'גבוה',
    urgent: 'דחוף'
  };
  return texts[priority] || priority;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL');
}

function showLoading() {
  return '<div class="flex justify-center items-center py-8"><div class="spinner"></div></div>';
}

// ===============================
// View Components
// ===============================

function LoginView() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <i class="fas fa-tasks text-6xl text-blue-400 mb-4"></i>
          <h1 class="text-3xl font-bold text-gray-800">מערכת ניהול משימות</h1>
          <p class="text-gray-600 mt-2">כניסה למנהלים</p>
        </div>
        
        <form id="loginForm" class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">שם משתמש</label>
            <input 
              type="text" 
              id="username" 
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              placeholder="הכנס שם משתמש"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">סיסמה</label>
            <input 
              type="password" 
              id="password" 
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              placeholder="הכנס סיסמה"
              required
            />
          </div>
          
          <button 
            type="submit" 
            class="w-full btn-mobile bg-blue-400 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition duration-200 shadow-lg"
          >
            <i class="fas fa-sign-in-alt ml-2"></i>
            כניסה למערכת
          </button>
        </form>
        

      </div>
    </div>
  `;
}

function HeaderComponent() {
  return `
    <header class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-xl font-bold">
              <i class="fas fa-tasks ml-2"></i>
              ניהול משימות
            </h1>
            <p class="text-sm opacity-90">${currentUser.name} (${currentUser.role === 'manager' ? 'מנהל' : 'תת-מנהל'})</p>
          </div>
          <button 
            onclick="logout()" 
            class="btn-mobile bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition"
          >
            <i class="fas fa-sign-out-alt ml-2"></i>
            יציאה
          </button>
        </div>
      </div>
    </header>
  `;
}

function StatsComponent(stats) {
  if (!stats) return '';
  
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-md border border-slate-200">
        <div class="text-3xl font-bold text-slate-700">${stats.total || 0}</div>
        <div class="text-sm text-slate-600">סה"כ משימות</div>
      </div>
      <div class="bg-amber-50 rounded-xl p-4 shadow-md border border-amber-200">
        <div class="text-3xl font-bold text-amber-600">${stats.pending || 0}</div>
        <div class="text-sm text-amber-700">ממתינות</div>
      </div>
      <div class="bg-blue-50 rounded-xl p-4 shadow-md border border-blue-200">
        <div class="text-3xl font-bold text-blue-600">${stats.in_progress || 0}</div>
        <div class="text-sm text-blue-700">בתהליך</div>
      </div>
      <div class="bg-emerald-50 rounded-xl p-4 shadow-md border border-emerald-200">
        <div class="text-3xl font-bold text-emerald-600">${stats.completed || 0}</div>
        <div class="text-sm text-emerald-700">הושלמו</div>
      </div>
    </div>
  `;
}

function TaskCard(task) {
  const isManager = currentUser.role === 'manager';
  const canEdit = task.assigned_to === currentUser.id || isManager;
  const isCompleted = task.status === 'completed';
  
  return `
    <div class="rounded-xl shadow-md p-5 mb-4 border-r-4 ${isCompleted ? 'bg-gray-50 opacity-75' : 'bg-white'} ${getPriorityColor(task.priority)}">
      <div class="flex justify-between items-start mb-3">
        <div class="flex-1">
          <h3 class="text-lg font-bold mb-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}">${task.title}</h3>
          ${task.description ? `<p class="text-sm mb-2 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}">${task.description}</p>` : ''}
        </div>
        ${isManager ? `
          <button 
            onclick="confirmDeleteTask(${task.id})" 
            class="text-rose-400 hover:text-rose-600 p-2"
          >
            <i class="fas fa-trash"></i>
          </button>
        ` : ''}
      </div>
      
      <div class="flex flex-wrap gap-2 mb-3">
        <span class="px-3 py-1 border ${getStatusColor(task.status)} text-xs rounded-full font-bold">
          ${getStatusText(task.status)}
        </span>
        <span class="px-3 py-1 ${getPriorityColor(task.priority)} text-white text-xs rounded-full font-bold">
          ${getPriorityText(task.priority)}
        </span>
        ${task.due_date ? `
          <span class="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
            <i class="far fa-calendar ml-1"></i>
            ${formatDate(task.due_date)}
          </span>
        ` : ''}
      </div>
      
      <div class="text-xs text-gray-500 mb-3">
        <div><i class="fas fa-user ml-1"></i> <strong>הוקצה ל:</strong> ${task.assigned_to_name}</div>
        ${isManager ? `<div><i class="fas fa-user-tie ml-1"></i> <strong>נוצר על ידי:</strong> ${task.created_by_name}</div>` : ''}
      </div>
      
      ${canEdit && !isCompleted ? `
        <div class="flex gap-2 flex-wrap">
          ${task.status !== 'in_progress' ? `
            <button 
              onclick="quickUpdateStatus(${task.id}, 'in_progress')" 
              class="flex-1 btn-mobile bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition"
            >
              <i class="fas fa-play ml-1"></i>
              התחל
            </button>
          ` : ''}
          ${task.status !== 'blocked' ? `
            <button 
              onclick="quickUpdateStatus(${task.id}, 'completed')" 
              class="flex-1 btn-mobile bg-emerald-400 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition"
            >
              <i class="fas fa-check ml-1"></i>
              סיים
            </button>
          ` : ''}
          <button 
            onclick="showTaskDetails(${task.id})" 
            class="btn-mobile bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold transition"
          >
            <i class="fas fa-comment-dots ml-1"></i>
            עדכן
          </button>
        </div>
      ` : ''}
      ${isCompleted ? `
        <button 
          onclick="showTaskDetails(${task.id})" 
          class="w-full btn-mobile bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold transition"
        >
          <i class="fas fa-eye ml-1"></i>
          צפייה
        </button>
      ` : ''}
    </div>
  `;
}

function ManagerDashboard(stats) {
  return `
    ${HeaderComponent()}
    
    <div class="container mx-auto px-4 py-6 max-w-4xl">
      ${StatsComponent(stats)}
      
      <button 
        onclick="showNewTaskForm()" 
        class="w-full btn-mobile bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg mb-6 text-lg"
      >
        <i class="fas fa-plus-circle ml-2"></i>
        הוסף משימה חדשה
      </button>
      
      <div class="bg-white rounded-xl shadow-md p-4 mb-4">
        <h2 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-filter ml-2"></i>
          סינון לפי סטטוס
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <button onclick="filterTasks('all', null)" class="btn-mobile bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg font-bold transition">
            הכל
          </button>
          <button onclick="filterTasks('pending', null)" class="btn-mobile bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-3 rounded-lg font-bold transition border border-amber-200">
            ממתינות
          </button>
          <button onclick="filterTasks('in_progress', null)" class="btn-mobile bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg font-bold transition border border-blue-200">
            בתהליך
          </button>
          <button onclick="filterTasks('completed', null)" class="btn-mobile bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-3 rounded-lg font-bold transition border border-emerald-200">
            הושלמו
          </button>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-md p-4 mb-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-users ml-2"></i>
          סינון לפי תת-מנהל
        </h2>
        <div class="grid grid-cols-2 gap-3" id="subManagerFilter">
          ${showLoading()}
        </div>
      </div>
      
      <div id="tasksList">
        ${showLoading()}
      </div>
    </div>
  `;
}

function SubManagerDashboard(stats) {
  return `
    ${HeaderComponent()}
    
    <div class="container mx-auto px-4 py-6 max-w-4xl">
      ${StatsComponent(stats)}
      
      <button 
        onclick="showNewTaskFormForSelf()" 
        class="w-full btn-mobile bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg mb-6 text-lg"
      >
        <i class="fas fa-plus-circle ml-2"></i>
        הוסף משימה לעצמי
      </button>
      
      <div class="bg-white rounded-xl shadow-md p-4 mb-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-filter ml-2"></i>
          סינון משימות
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <button onclick="filterMyTasks('all')" class="btn-mobile bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg font-bold transition">
            הכל
          </button>
          <button onclick="filterMyTasks('pending')" class="btn-mobile bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-3 rounded-lg font-bold transition border border-amber-200">
            ממתינות
          </button>
          <button onclick="filterMyTasks('in_progress')" class="btn-mobile bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg font-bold transition border border-blue-200">
            בתהליך
          </button>
          <button onclick="filterMyTasks('completed')" class="btn-mobile bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-3 rounded-lg font-bold transition border border-emerald-200">
            הושלמו
          </button>
        </div>
      </div>
      
      <div id="tasksList">
        ${showLoading()}
      </div>
    </div>
  `;
}

function NewTaskFormModal(forSelf = false) {
  const isManager = currentUser.role === 'manager';
  
  return `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onclick="closeModal(event)">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-plus-circle ml-2"></i>
            משימה חדשה
          </h2>
          <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700 text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="newTaskForm" class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">כותרת המשימה *</label>
            <input 
              type="text" 
              id="taskTitle" 
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="הכנס כותרת"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">תיאור</label>
            <textarea 
              id="taskDescription" 
              rows="3"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="הכנס תיאור (אופציונלי)"
            ></textarea>
          </div>
          
          ${!forSelf ? `
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">הקצה ל *</label>
            <select 
              id="taskAssignee" 
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">בחר משתמש</option>
              ${isManager ? `<option value="${currentUser.id}">לעצמי (${currentUser.name})</option>` : ''}
              ${subManagers.map(sm => `<option value="${sm.id}">${sm.name}</option>`).join('')}
            </select>
          </div>
          ` : `
          <input type="hidden" id="taskAssignee" value="${currentUser.id}" />
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700">
            <i class="fas fa-info-circle ml-2"></i>
            המשימה תוקצה לך (${currentUser.name})
          </div>
          `}
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">עדיפות *</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                <input type="radio" name="priority" value="low" class="ml-2" />
                <span>נמוך</span>
              </label>
              <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                <input type="radio" name="priority" value="medium" checked class="ml-2" />
                <span>בינוני</span>
              </label>
              <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                <input type="radio" name="priority" value="high" class="ml-2" />
                <span>גבוה</span>
              </label>
              <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                <input type="radio" name="priority" value="urgent" class="ml-2" />
                <span>דחוף</span>
              </label>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">תאריך יעד</label>
            <input 
              type="date" 
              id="taskDueDate" 
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div class="flex gap-3 pt-4">
            <button 
              type="submit" 
              class="flex-1 btn-mobile bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
            >
              <i class="fas fa-check ml-2"></i>
              צור משימה
            </button>
            <button 
              type="button" 
              onclick="closeModal()" 
              class="btn-mobile bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold px-6 py-3 rounded-lg transition"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function TaskDetailsModal(taskId) {
  try {
    const response = await axios.get(`/api/tasks/${taskId}`);
    const task = response.data.task;
    const updates = response.data.updates;
    
    return `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onclick="closeModal(event)">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar" onclick="event.stopPropagation()">
          <div class="flex justify-between items-start mb-6">
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-800 mb-2">${task.title}</h2>
              ${task.description ? `<p class="text-gray-600">${task.description}</p>` : ''}
            </div>
            <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700 text-2xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="flex flex-wrap gap-2 mb-6">
            <span class="px-3 py-1 ${getStatusColor(task.status)} text-white text-sm rounded-full font-bold">
              ${getStatusText(task.status)}
            </span>
            <span class="px-3 py-1 ${getPriorityColor(task.priority)} text-white text-sm rounded-full font-bold">
              ${getPriorityText(task.priority)}
            </span>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
            <div><strong>הוקצה ל:</strong> ${task.assigned_to_name}</div>
            <div><strong>נוצר על ידי:</strong> ${task.created_by_name}</div>
            ${task.due_date ? `<div><strong>תאריך יעד:</strong> ${formatDate(task.due_date)}</div>` : ''}
            <div><strong>נוצר:</strong> ${formatDate(task.created_at)}</div>
          </div>
          
          ${task.status !== 'completed' ? `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-gray-800 mb-3">עדכון סטטוס</h3>
              <div class="grid grid-cols-2 gap-2 mb-4">
                ${task.status !== 'pending' ? `
                  <button onclick="updateStatus(${task.id}, 'pending')" class="btn-mobile bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg font-bold">
                    ממתין
                  </button>
                ` : ''}
                ${task.status !== 'in_progress' ? `
                  <button onclick="updateStatus(${task.id}, 'in_progress')" class="btn-mobile bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-bold">
                    בתהליך
                  </button>
                ` : ''}
                ${task.status !== 'completed' ? `
                  <button onclick="updateStatus(${task.id}, 'completed')" class="btn-mobile bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-bold">
                    הושלם
                  </button>
                ` : ''}
                ${task.status !== 'blocked' ? `
                  <button onclick="updateStatus(${task.id}, 'blocked')" class="btn-mobile bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-bold">
                    חסום
                  </button>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-3">הוסף עדכון</h3>
            <form id="updateForm" onsubmit="submitUpdate(event, ${task.id})">
              <textarea 
                id="updateText" 
                rows="3"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-3"
                placeholder="כתוב עדכון או הערה..."
                required
              ></textarea>
              <button type="submit" class="w-full btn-mobile bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg">
                <i class="fas fa-paper-plane ml-2"></i>
                שלח עדכון
              </button>
            </form>
          </div>
          
          ${updates && updates.length > 0 ? `
            <div>
              <h3 class="text-lg font-bold text-gray-800 mb-3">
                <i class="fas fa-history ml-2"></i>
                היסטוריית עדכונים
              </h3>
              <div class="space-y-3">
                ${updates.map(update => `
                  <div class="bg-gray-50 rounded-lg p-4 border-r-4 border-blue-400">
                    <div class="flex justify-between items-start mb-2">
                      <span class="font-bold text-gray-800">${update.user_name}</span>
                      <span class="text-xs text-gray-500">${formatDate(update.created_at)}</span>
                    </div>
                    <p class="text-gray-700">${update.update_text}</p>
                    ${update.old_status && update.new_status ? `
                      <div class="mt-2 text-xs">
                        <span class="px-2 py-1 ${getStatusColor(update.old_status)} text-white rounded">
                          ${getStatusText(update.old_status)}
                        </span>
                        <i class="fas fa-arrow-left mx-1"></i>
                        <span class="px-2 py-1 ${getStatusColor(update.new_status)} text-white rounded">
                          ${getStatusText(update.new_status)}
                        </span>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Load task details error:', error);
    return '';
  }
}

// ===============================
// Event Handlers
// ===============================

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  const success = await login(username, password);
  if (success) {
    render();
  } else {
    alert('שם משתמש או סיסמה שגויים');
  }
}

async function showNewTaskForm() {
  await loadSubManagers();
  const modal = document.createElement('div');
  modal.id = 'modal';
  modal.innerHTML = NewTaskFormModal(false);
  document.body.appendChild(modal);
  
  document.getElementById('newTaskForm').addEventListener('submit', handleCreateTask);
}

async function showNewTaskFormForSelf() {
  const modal = document.createElement('div');
  modal.id = 'modal';
  modal.innerHTML = NewTaskFormModal(true);
  document.body.appendChild(modal);
  
  document.getElementById('newTaskForm').addEventListener('submit', handleCreateTask);
}

async function handleCreateTask(e) {
  e.preventDefault();
  
  const title = document.getElementById('taskTitle').value;
  const description = document.getElementById('taskDescription').value;
  const assignedTo = document.getElementById('taskAssignee').value;
  const priority = document.querySelector('input[name="priority"]:checked').value;
  const dueDate = document.getElementById('taskDueDate').value;
  
  const success = await createTask({
    title,
    description,
    priority,
    assigned_to: assignedTo,
    created_by: currentUser.id,
    due_date: dueDate || null
  });
  
  if (success) {
    closeModal();
    loadDashboard();
  } else {
    alert('שגיאה ביצירת המשימה');
  }
}

async function quickUpdateStatus(taskId, status) {
  const success = await updateTaskStatus(taskId, status);
  if (success) {
    loadDashboard();
  } else {
    alert('שגיאה בעדכון המשימה');
  }
}

async function updateStatus(taskId, status) {
  const success = await updateTaskStatus(taskId, status);
  if (success) {
    closeModal();
    loadDashboard();
  } else {
    alert('שגיאה בעדכון המשימה');
  }
}

async function submitUpdate(e, taskId) {
  e.preventDefault();
  const updateText = document.getElementById('updateText').value;
  
  const success = await addTaskUpdate(taskId, updateText);
  if (success) {
    // Reload modal with updated data
    const modalHtml = await TaskDetailsModal(taskId);
    document.getElementById('modal').innerHTML = modalHtml;
  } else {
    alert('שגיאה בהוספת העדכון');
  }
}

async function showTaskDetails(taskId) {
  const modal = document.createElement('div');
  modal.id = 'modal';
  modal.innerHTML = showLoading();
  document.body.appendChild(modal);
  
  const modalHtml = await TaskDetailsModal(taskId);
  modal.innerHTML = modalHtml;
}

async function confirmDeleteTask(taskId) {
  if (confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) {
    const success = await deleteTask(taskId);
    if (success) {
      loadDashboard();
    } else {
      alert('שגיאה במחיקת המשימה');
    }
  }
}

function closeModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById('modal');
  if (modal) modal.remove();
}

let currentFilters = { created_by: null, status: null, user_id: null };

async function filterTasks(status, userId) {
  const filters = { created_by: currentUser.id };
  
  if (status && status !== 'all') {
    filters.status = status;
    currentFilters.status = status;
  } else {
    currentFilters.status = null;
  }
  
  if (userId) {
    filters.user_id = userId;
    currentFilters.user_id = userId;
    delete filters.created_by;
  } else {
    currentFilters.user_id = null;
  }
  
  const filteredTasks = await loadTasks(filters);
  displayTasks(filteredTasks);
}

async function filterBySubManager(userId) {
  currentFilters.user_id = userId;
  const filters = {};
  
  if (userId !== 'all') {
    filters.user_id = userId;
  } else {
    filters.created_by = currentUser.id;
  }
  
  if (currentFilters.status && currentFilters.status !== 'all') {
    filters.status = currentFilters.status;
  }
  
  const filteredTasks = await loadTasks(filters);
  displayTasks(filteredTasks);
}

async function filterMyTasks(status) {
  const filters = { user_id: currentUser.id };
  if (status !== 'all') {
    filters.status = status;
  }
  
  const filteredTasks = await loadTasks(filters);
  displayTasks(filteredTasks);
}

function displayTasks(tasksList) {
  const container = document.getElementById('tasksList');
  if (tasksList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">אין משימות להצגה</p>
      </div>
    `;
  } else {
    container.innerHTML = tasksList.map(task => TaskCard(task)).join('');
  }
}

// ===============================
// Main Render Functions
// ===============================

async function loadDashboard() {
  const stats = await loadStats();
  
  if (currentUser.role === 'manager') {
    await loadSubManagers();
    const managerTasks = await loadTasks({ created_by: currentUser.id });
    document.getElementById('app').innerHTML = ManagerDashboard(stats);
    
    // Add sub-manager filter buttons
    const filterContainer = document.getElementById('subManagerFilter');
    if (filterContainer) {
      filterContainer.innerHTML = `
        <button onclick="filterBySubManager('all')" class="btn-mobile bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg font-bold transition col-span-2">
          כל המשימות
        </button>
        <button onclick="filterBySubManager('${currentUser.id}')" class="btn-mobile bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-bold transition border border-purple-200">
          <i class="fas fa-user ml-1"></i>
          המשימות שלי
        </button>
        ${subManagers.map(sm => `
          <button onclick="filterBySubManager('${sm.id}')" class="btn-mobile bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-3 rounded-lg font-bold transition border border-indigo-200">
            ${sm.name}
          </button>
        `).join('')}
      `;
    }
    
    displayTasks(managerTasks);
  } else {
    const myTasks = await loadTasks({ user_id: currentUser.id });
    document.getElementById('app').innerHTML = SubManagerDashboard(stats);
    displayTasks(myTasks);
  }
}

async function render() {
  const app = document.getElementById('app');
  
  if (!currentUser) {
    app.innerHTML = LoginView();
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
  } else {
    await loadDashboard();
  }
}

// ===============================
// Initialize App
// ===============================

render();
