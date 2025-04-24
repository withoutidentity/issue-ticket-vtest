import authRoutes from './auth.routes'

export default function registerRoutes(app: any) {
  app.use('/auth', authRoutes)
}
