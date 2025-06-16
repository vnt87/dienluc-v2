require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { startScheduler } = require('./services/scheduler');
const exphbs = require('express-handlebars');

const app = express();

// Cấu hình Handlebars
const hbs = exphbs.create({
    extname: '.handlebars',
    helpers: {
        formatDate: function(date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        eq: function(v1, v2) {
            return v1 === v2;
        },
        json: function(context) {
            return JSON.stringify(context, null, 2);
        },
        notEmpty: function(value) {
            return value && value.trim() !== '';
        },
        range: function(start, end) {
            let arr = [];
            for (let i = start; i <= end; i++) arr.push(i);
            return arr;
        },
        increment: function(value) {
            return parseInt(value) + 1;
        },
        decrement: function(value) {
            return parseInt(value) - 1;
        },
        gt: function(a, b) {
            return a > b;
        },
        lt: function(a, b) {
            return a < b;
        }
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/search', require('./routes/search'));
app.use('/telegram', require('./routes/telegram'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Khởi động scheduler sau khi kết nối database thành công
    startScheduler();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 