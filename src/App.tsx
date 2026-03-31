import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import StatusBar from './components/StatusBar'

const EasyAsPieRoute = lazy(() => import('./games/easy-as-pie/index'))
const IntricateExtricateRoute = lazy(() => import('./games/intricate-extricate/index'))

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/easy-as-pie"
          element={
            <Suspense fallback={<div style={{ height: '100vh', background: 'var(--color-bg)' }} />}>
              <EasyAsPieRoute />
            </Suspense>
          }
        />
        <Route
          path="/intricate-extricate"
          element={
            <Suspense fallback={<div style={{ height: '100vh', background: 'var(--color-bg)' }} />}>
              <IntricateExtricateRoute />
            </Suspense>
          }
        />
      </Routes>
      <StatusBar />
    </>
  )
}
