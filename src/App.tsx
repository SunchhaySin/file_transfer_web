import './index.css'
import Footer from './components/page/footer'
import Canvas from './components/page/canvas';

function App() {
  return (
    <div className="bg-linear-to-b from-green-400/80 to-green-500/20 text-black">
      <main className="min-h-lvh flex flex-col">
        <Canvas />
      </main>
      <Footer />
    </div>
  );  
}

export default App
