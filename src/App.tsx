import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import StatusBar from './components/StatusBar'

const EasyAsPieRoute = lazy(() => import('./games/easy-as-pie/index'))
const IntricateExtricateRoute = lazy(() => import('./games/intricate-extricate/index'))
const FisheyeRoute = lazy(() => import('./games/fisheye/index'))
const TempoTapRoute = lazy(() => import('./games/tempo-tap/index'))
const XornadoRoute = lazy(() => import('./games/xornado/index'))
const ReverbRoute = lazy(() => import('./games/reverb/index'))
const CounterRoute = lazy(() => import('./games/counter/index'))

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
        <Route
          path="/fisheye"
          element={
            <Suspense fallback={<div style={{ height: '100vh', background: 'var(--color-bg)' }} />}>
              <FisheyeRoute />
            </Suspense>
          }
        />
        <Route
          path="/tempo-tap"
          element={
            <Suspense fallback={<div style={{ height: '100vh', background: 'var(--color-bg)' }} />}>
              <TempoTapRoute />
            </Suspense>
          }
        />
        <Route
          path="/xornado"
          element={
            <Suspense fallback={<div style={{ height: '100vh', background: 'var(--color-bg)' }} />}>
              <XornadoRoute />
            </Suspense>
          }
        />
        <Route
          path="/reverb"
          element={
            <Suspense fallback={<div style={{ height: '100vh', background: 'var(--color-bg)' }} />}>
              <ReverbRoute />
            </Suspense>
          }
        />
        <Route
          path="/counter"
          element={
            <Suspense fallback={<div style={{ height: '100vh', background: 'var(--color-bg)' }} />}>
              <CounterRoute />
            </Suspense>
          }
        />
      </Routes>
      <StatusBar />
    </>
  )
}
