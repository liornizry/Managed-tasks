-- Insert demo users (סיסמה: 123456 להדגמה בלבד)
-- המנהל הראשי
INSERT OR IGNORE INTO users (id, username, password, name, role, manager_id) VALUES 
  (1, 'admin', '123456', 'ליאור נזרי', 'manager', NULL);

-- תתי המנהלים (תחת המנהל הראשי)
INSERT OR IGNORE INTO users (id, username, password, name, role, manager_id) VALUES 
  (2, 'A1', '123456', 'שקד קדושים', 'sub_manager', 1),
  (3, 'A2', '123456', 'אושר חכם', 'sub_manager', 1),
  (4, 'A3', '123456', 'נדב פורת', 'sub_manager', 1);
  (5, 'A4', '123456', 'דניאל', 'sub_manager', 1);

-- Insert demo tasks
INSERT OR IGNORE INTO tasks (title, description, status, priority, assigned_to, created_by, due_date) VALUES 
  ('השלמת דוח רבעוני', 'יש להשלים את הדוח הרבעוני לחודש נובמבר', 'in_progress', 'high', 2, 1, '2025-11-15'),
  ('בדיקת מלאי', 'ביצוע ספירת מלאי במחסן הראשי', 'pending', 'medium', 2, 1, '2025-11-10'),
  ('פגישה עם לקוחות', 'תיאום פגישות עם לקוחות חדשים', 'pending', 'high', 3, 1, '2025-11-08'),
  ('עדכון מערכת', 'עדכון המערכת לגרסה החדשה', 'completed', 'medium', 3, 1, '2025-11-05'),
  ('הכנת מצגת', 'הכנת מצגת להנהלה הבכירה', 'in_progress', 'urgent', 4, 1, '2025-11-07'),
  ('בדיקת איכות', 'ביצוע בדיקות איכות למוצרים החדשים', 'pending', 'high', 4, 1, '2025-11-12');

-- Insert some task updates
INSERT OR IGNORE INTO task_updates (task_id, user_id, update_text, old_status, new_status) VALUES 
  (1, 2, 'התחלתי לעבוד על הדוח', 'pending', 'in_progress'),
  (4, 3, 'סיימתי את העדכון בהצלחה', 'in_progress', 'completed'),
  (5, 4, 'עובד על המצגת, צפוי להסתיים מחר', 'pending', 'in_progress');
