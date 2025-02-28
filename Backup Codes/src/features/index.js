const authRoutes = require('@src/features/auth/routes/authRoutes');
const userRoutes = require('@src/features/user/routes/userRoutes');
const mediaRoutes = require('@src/features/media/routes/mediaRoutes');
const recommenderRoutes = require('@src/features/recommender/routes/recommenderRoutes');

module.exports = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/recommender', recommenderRoutes);
};
