import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
//import './App.css'
import * as BUI from "@thatopen/ui"
import IFCViewer from './components/IFCViewer'
import * as OBC from "@thatopen/components";
import React from 'react'
import { todoTool } from './components/ToDoCreator/src/Template'
import BimTable from './components/BimTable'

BUI.Manager.init()

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "bim-grid": any;
      "bim-text-input": any;
      "bim-button": any;
      "bim-label": any;
      "bim-panel": any;
      "bim-panel-section": any;
      "bim-table": any;
      "bim-dropdown": any;
      "bim-option": any;
      "bim-toolbar": any;
      "bim-toolbar-section": any;
      "bim-toolbar-group": any;
      "bim-viewport": any;
    }
  }
}

function App() {
  const components = new OBC.Components();
  const todoCOntainer = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(()=>{
    const todoButton = todoTool({components});
    todoCOntainer.current?.appendChild(todoButton);
  },[])

  return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', margin:"0 auto", minHeight:'800px', minWidth:'900px'}}>
      <div style={{flex:"0 0 20%", display:'flex', alignItems:'center', justifyContent:'end'}} ref={todoCOntainer}>
        <BimTable components={components} />
      </div>
      <div style={{flex:"0 0 80%"}}>
        <IFCViewer components={components}/>
      </div>
      
    </div>
  )
}

export default App
