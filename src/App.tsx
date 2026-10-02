import './index.css'
import Dashboard from './components/page/dashboard'
import Footer from './components/page/footer'

function App() {
  return (
    <div className="min-h-screen bg-linear-to-b from-green-400/80 to-green-500/20 text-black">
      <main className="flex flex-col h-lvh overflow-hidden">
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
}

export default App
