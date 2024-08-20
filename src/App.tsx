import './App.css'
import Autocomplete from './components/AutoComplete/Autocomplete';

function App() {
  const options = ['Apple', 'Banana', 'Cherry', 'Durian', 'Grape', 'Orange', 'Pineapple', 'Guava', 'Papaya', "Coconut" ];
  return (
    <>
    <div>
      <Autocomplete options={options} isAsync={false} label="Choose a fruit 🍑 🥝 🍉 🥥 🍋 🍐  " placeholder="Type to search..." />
      
      <div className='mb-10'></div>
      <Autocomplete options={options} isAsync={true} label="Choose a fruit (asynchronously) 🍑 🥝 🍉 🥥 🍋 🍐  " placeholder="Type to search..." />
    </div>
    </>
  )
}

export default App
