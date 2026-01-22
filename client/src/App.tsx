import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import EditorPage from './pages/EditorPage'
import TableViewPage from './pages/TableViewPage'
import SubscriptionsPage from './pages/SubscriptionsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<EditorPage />} />
          <Route path="table/:typeId" element={<TableViewPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
