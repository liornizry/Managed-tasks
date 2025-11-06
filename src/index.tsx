import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ===============================
// Authentication API
// ===============================

// Login endpoint
app.post('/api/login', async (c) => {
  const { username, password } = await c.req.json()
  
  try {
    const user = await c.env.DB.prepare(
      'SELECT id, username, name, role, manager_id FROM users WHERE username = ? AND password = ?'
    ).bind(username, password).first()
    
    if (!user) {
      return c.json({ error: 'שם משתמש או סיסמה שגויים' }, 401)
    }
    
    return c.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        manager_id: user.manager_id
      }
    })
  } catch (error) {
    return c.json({ error: 'שגיאה בהתחברות' }, 500)
  }
})

// ===============================
// Users API
// ===============================

// Get all sub-managers (for manager view)
app.get('/api/users/sub-managers', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT id, username, name, role, created_at 
       FROM users 
       WHERE role = 'sub_manager' 
       ORDER BY name`
    ).all()
    
    return c.json({ users: result.results })
  } catch (error) {
    return c.json({ error: 'שגיאה בטעינת המשתמשים' }, 500)
  }
})

// Get user by id
app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const user = await c.env.DB.prepare(
      'SELECT id, username, name, role, manager_id FROM users WHERE id = ?'
    ).bind(id).first()
    
    if (!user) {
      return c.json({ error: 'משתמש לא נמצא' }, 404)
    }
    
    return c.json({ user })
  } catch (error) {
    return c.json({ error: 'שגיאה בטעינת המשתמש' }, 500)
  }
})

// ===============================
// Tasks API
// ===============================

// Get all tasks (with filters)
app.get('/api/tasks', async (c) => {
  const userId = c.req.query('user_id')
  const status = c.req.query('status')
  const createdBy = c.req.query('created_by')
  
  try {
    let query = `
      SELECT 
        t.*,
        u1.name as assigned_to_name,
        u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (userId) {
      query += ' AND t.assigned_to = ?'
      params.push(userId)
    }
    
    if (status) {
      query += ' AND t.status = ?'
      params.push(status)
    }
    
    if (createdBy) {
      query += ' AND t.created_by = ?'
      params.push(createdBy)
    }
    
    query += ' ORDER BY t.created_at DESC'
    
    const result = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ tasks: result.results })
  } catch (error) {
    return c.json({ error: 'שגיאה בטעינת המשימות' }, 500)
  }
})

// Get single task with updates
app.get('/api/tasks/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const task = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u1.name as assigned_to_name,
        u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = ?
    `).bind(id).first()
    
    if (!task) {
      return c.json({ error: 'משימה לא נמצאה' }, 404)
    }
    
    const updates = await c.env.DB.prepare(`
      SELECT tu.*, u.name as user_name
      FROM task_updates tu
      LEFT JOIN users u ON tu.user_id = u.id
      WHERE tu.task_id = ?
      ORDER BY tu.created_at DESC
    `).bind(id).all()
    
    return c.json({ 
      task,
      updates: updates.results 
    })
  } catch (error) {
    return c.json({ error: 'שגיאה בטעינת המשימה' }, 500)
  }
})

// Create new task (manager only)
app.post('/api/tasks', async (c) => {
  const { title, description, priority, assigned_to, created_by, due_date } = await c.req.json()
  
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO tasks (title, description, priority, assigned_to, created_by, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(title, description, priority || 'medium', assigned_to, created_by, due_date).run()
    
    return c.json({ 
      success: true,
      task_id: result.meta.last_row_id 
    })
  } catch (error) {
    return c.json({ error: 'שגיאה ביצירת המשימה' }, 500)
  }
})

// Update task status
app.patch('/api/tasks/:id/status', async (c) => {
  const id = c.req.param('id')
  const { status, user_id, update_text } = await c.req.json()
  
  try {
    // Get current task status
    const task = await c.env.DB.prepare('SELECT status FROM tasks WHERE id = ?').bind(id).first()
    
    if (!task) {
      return c.json({ error: 'משימה לא נמצאה' }, 404)
    }
    
    const oldStatus = task.status
    
    // Update task status
    const completedAt = status === 'completed' ? new Date().toISOString() : null
    await c.env.DB.prepare(`
      UPDATE tasks 
      SET status = ?, updated_at = CURRENT_TIMESTAMP, completed_at = ?
      WHERE id = ?
    `).bind(status, completedAt, id).run()
    
    // Add update record
    await c.env.DB.prepare(`
      INSERT INTO task_updates (task_id, user_id, update_text, old_status, new_status)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, user_id, update_text || `עדכון סטטוס ל-${status}`, oldStatus, status).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'שגיאה בעדכון המשימה' }, 500)
  }
})

// Add task update/comment
app.post('/api/tasks/:id/updates', async (c) => {
  const id = c.req.param('id')
  const { user_id, update_text } = await c.req.json()
  
  try {
    await c.env.DB.prepare(`
      INSERT INTO task_updates (task_id, user_id, update_text)
      VALUES (?, ?, ?)
    `).bind(id, user_id, update_text).run()
    
    await c.env.DB.prepare(`
      UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(id).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'שגיאה בהוספת העדכון' }, 500)
  }
})

// Delete task (manager only)
app.delete('/api/tasks/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await c.env.DB.prepare('DELETE FROM task_updates WHERE task_id = ?').bind(id).run()
    await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'שגיאה במחיקת המשימה' }, 500)
  }
})

// ===============================
// Statistics API
// ===============================

app.get('/api/stats/:userId', async (c) => {
  const userId = c.req.param('userId')
  const role = c.req.query('role')
  
  try {
    let stats: any = {}
    
    if (role === 'manager') {
      // Manager stats - all tasks they created
      const result = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
        FROM tasks
        WHERE created_by = ?
      `).bind(userId).first()
      
      stats = result
    } else {
      // Sub-manager stats - tasks assigned to them
      const result = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
        FROM tasks
        WHERE assigned_to = ?
      `).bind(userId).first()
      
      stats = result
    }
    
    return c.json({ stats })
  } catch (error) {
    return c.json({ error: 'שגיאה בטעינת הסטטיסטיקות' }, 500)
  }
})

// ===============================
// Main HTML Page
// ===============================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>מערכת ניהול משימות</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          /* Custom RTL and mobile optimizations */
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Large touch targets for mobile */
          .btn-mobile {
            min-height: 48px;
            min-width: 48px;
            font-size: 1.1rem;
          }
          
          /* Status badges */
          .status-pending { background: #fbbf24; }
          .status-in_progress { background: #3b82f6; }
          .status-completed { background: #10b981; }
          .status-blocked { background: #ef4444; }
          
          /* Priority badges */
          .priority-low { background: #94a3b8; }
          .priority-medium { background: #f59e0b; }
          .priority-high { background: #dc2626; }
          .priority-urgent { background: #9333ea; }
          
          /* Hide scrollbar but keep functionality */
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Loading spinner */
          .spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
