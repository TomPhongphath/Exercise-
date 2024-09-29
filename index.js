const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // ใช้ UUID สำหรับสร้าง _id

// ตั้งค่า Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// In-memory storage
const users = [];
const exercises = [];

// 2. POST /api/users เพื่อสร้างผู้ใช้ใหม่
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const newUser = { username, _id: uuidv4() }; // สร้าง _id ด้วย UUID
  users.push(newUser); // เก็บผู้ใช้ในอาเรย์
  res.json(newUser);
});

// 4. GET /api/users เพื่อดึงรายชื่อผู้ใช้ทั้งหมด
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 7. POST /api/users/:_id/exercises เพื่อบันทึกการออกกำลังกาย
app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const exerciseDate = date ? new Date(date) : new Date(); // ใช้วันที่ปัจจุบันถ้าไม่ได้ส่งมา
  const newExercise = {
    userId,
    description,
    duration: parseInt(duration),
    date: exerciseDate
  };
  
  exercises.push(newExercise); // เก็บข้อมูลการออกกำลังกายในอาเรย์
  
  res.json({
    _id: user._id,
    username: user.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date.toDateString()
  });
});

// 9. GET /api/users/:_id/logs เพื่อดึงข้อมูลการออกกำลังกายของผู้ใช้
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { from, to, limit } = req.query;
  
  let userExercises = exercises.filter(ex => ex.userId === userId);

  // กรองตามวันที่ถ้ามี from และ to
  if (from) {
    const fromDate = new Date(from);
    userExercises = userExercises.filter(ex => ex.date >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    userExercises = userExercises.filter(ex => ex.date <= toDate);
  }

  // จำกัดจำนวน log ที่คืนกลับ
  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: userExercises.length,
    log: userExercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString()
    }))
  });
});

// เริ่มเซิร์ฟเวอร์
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
