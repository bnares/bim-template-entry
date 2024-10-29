import React from 'react'
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import { FragmentsGroup, IfcProperties } from "@thatopen/fragments";
import "../App.css"
import { TodoCreator } from './ToDoCreator/src';

interface ViewerData{
  components: OBC.Components,
}

const IFCViewer = (props:ViewerData) => {


    const {components} = props;
  let fragmentModel: FragmentsGroup | undefined
  const [classificationsTree, updateClassificationTree] = CUI.tables.classificationTree({
    components,
    classifications:[]
  })
  const setViewer = () => {
  
    const worlds = components.get(OBC.Worlds)

    const world = worlds.create<
      OBC.SimpleScene,
      OBC.OrthoPerspectiveCamera,
      OBCF.PostproductionRenderer
    >()

    const sceneComponent = new OBC.SimpleScene(components)
    world.scene = sceneComponent
    world.scene.setup()

    const viewerContainer = document.getElementById("viewer-container") as HTMLElement
    const rendererComponent = new OBCF.PostproductionRenderer(components, viewerContainer)
    world.renderer = rendererComponent

    const cameraComponent = new OBC.OrthoPerspectiveCamera(components)
    world.camera = cameraComponent
    
    components.init()

    world.camera.controls.setLookAt(3, 3, 3, 0, 0, 0)
    world.camera.updateAspect()

    const todoCreator = components.get(TodoCreator);
    todoCreator.world = world;

    const ifcLoader = components.get(OBC.IfcLoader)
    ifcLoader.setup()

    const cullers = components.get(OBC.Cullers);
    const culler = cullers.create(world); //we need to thell the culler on which world is going to operate


    const fragmentsManager = components.get(OBC.FragmentsManager);
    fragmentsManager.onFragmentsLoaded.add(async (model) => {
      world.scene.three.add(model)
      if(model.hasProperties){
        processModel(model);
      }

      for(const fragment of model.items){
        //culler.add(fragment.mesh);
      }
      culler.needsUpdate = true;
      world.camera.controls.addEventListener("controlend",()=>{
        //culler.needsUpdate = true;
      })
      fragmentModel = model;
    })

    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world })
    highlighter.zoomToSelection = true;

    viewerContainer.addEventListener("resize", () => {
      rendererComponent.resize()
      cameraComponent.updateAspect()
    })
  }

  const processModel = async (model : FragmentsGroup)=>{
    const indexer = components.get(OBC.IfcRelationsIndexer)
    await indexer.process(model)
    //indexer.getEntityRelations(model,5,"HasAssignments")
    console.log("indexer: ", indexer);

    const classifier = components.get(OBC.Classifier);
    await classifier.bySpatialStructure(model);
    classifier.byEntity(model);
    //classifier.find()
    const classifications = [
      
      {
        system: "spatialStructures", label: "Spatial Containers"
      },
      {
        system:"entities", label:"Entities"
      }
      
    ]

    if(updateClassificationTree){
      updateClassificationTree({classifications})
    }
  }

  const FileExport=(file : Blob, filName:string)=>{
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filName;
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFragmentExport = ()=>{
    //const json = JSON.stringify(this.list, null, 2)
    if(!fragmentModel) return;
    const propertiesMOdel = JSON.stringify(fragmentModel.getLocalProperties());
    const propertiesFile = new Blob([propertiesMOdel]);

    const fragmentManager = components.get(OBC.FragmentsManager);
    const fragmentBinary =  fragmentManager.export(fragmentModel)
    const blob = new Blob([fragmentBinary])


    FileExport(blob,`${fragmentModel.name}.frag`);
    FileExport(propertiesFile, `${fragmentModel.name}.json`);
    
  }

  const onFragmentImport =async ()=>{
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    input.addEventListener("change", async()=>{
      const fileList = input.files;
      if(!fileList) return;
      const fragmentManager = components.get(OBC.FragmentsManager);
      const models :{[file:string]:FragmentsGroup}={};
      const propeties :{[file:string]:IfcProperties} = {};

      for(const file of fileList){
        const split = file.name.split(".");
        if(split[split.length-1]=="frag"){
          const data = await file.arrayBuffer();
          models[split[0]] = fragmentManager.load(new Uint8Array(data));
        }else if(split[split.length-1]=="json"){
          const data =await file.text();
          propeties[split[0]] = JSON.parse(data);
        }
      }

      for(const file in propeties){
        if(models[file]){
          models[file].setLocalProperties(propeties[file]);
          await processModel(models[file])
        }
      }

    })
    input.click();
  }

  const onFragmentDispose = ()=>{
    const fragmentManager = components.get(OBC.FragmentsManager);
    for(const [, group] of fragmentManager.groups){
      fragmentManager.disposeGroup(group);
    }
    fragmentModel = undefined;
  }


  const onToggleVisibility = () => {
    const highlighter = components.get(OBCF.Highlighter)
    const fragments = components.get(OBC.FragmentsManager)

    const selection = highlighter.selection.select
    if (Object.keys(selection).length === 0) return;
    for (const fragmentID in selection) {  
      const fragment = fragments.list.get(fragmentID)
      const expressIDs = selection[fragmentID]
      for (const id of expressIDs) {
        if (!fragment) continue
        const isHidden = fragment.hiddenItems.has(id)
        if (isHidden) {
          fragment.setVisibility(true, [id])
        } else {
          fragment.setVisibility(false, [id])
        }
      }
    }
  }

  const onIsolate = () => {
    const highlighter = components.get(OBCF.Highlighter)
    const hider = components.get(OBC.Hider)
    const selection = highlighter.selection.select
    hider.isolate(selection)
  };

  const onShowAll = () => {
    const hider = components.get(OBC.Hider)
    hider.set(true)
  }

  const onShowProperties = async () => {
    if (!fragmentModel) return
    const highlighter = components.get(OBCF.Highlighter)
    const selection = highlighter.selection.select
    const indexer = components.get(OBC.IfcRelationsIndexer)
    for (const fragmentID in selection) {
      const expressIDs = selection[fragmentID]
      for (const id of expressIDs) {
        const psets = indexer.getEntityRelations(fragmentModel, id, "ContainedInStructure");
        if(psets){
          for(const expressId of psets){
            const prop = await fragmentModel.getProperties(expressId);
            console.log(prop);
          }
          
        }
        //console.log(psets)
      }
    }
  }

  const setupUI = () => {
    const viewerContainer = document.getElementById("viewer-container") as HTMLElement
    if (!viewerContainer) return

    const floatingGrid = BUI.Component.create<BUI.Grid>(() => {
      return BUI.html`
        <bim-grid floating style="padding: 20px;"></bim-grid>
      `
    })

    const onClassifier = ()=>{
      if(!floatingGrid) return;
      if(floatingGrid.layout!=="classifier"){
        floatingGrid.layout = "classifier";
      }else{
        floatingGrid.layout="main";
      }
    }

    const classifierPanel = BUI.Component.create<BUI.Panel>(()=>{

      return BUI.html`
      <bim-panel>
          <bim-panel-section 
            name="classifier" 
            label="Classifier" 
            icon="solar:document-bold" 
            fixed
          >
            <bim-label>Classifications</bim-label>
            ${classificationsTree}
          </bim-panel-section>
        </bim-panel>
      `
    })

    const elementPropertyPanel = BUI.Component.create<BUI.Panel>(()=>{
      const [propsTable, updatePropsTable] = CUI.tables.elementProperties({
        components,
        fragmentIdMap:{}
      });
      const highlighter = components.get(OBCF.Highlighter);

      highlighter.events.select.onHighlight.add((fragmentIdMap)=>{
        if(!floatingGrid) return;
        floatingGrid.layout = "second";
        updatePropsTable({fragmentIdMap});
        propsTable.expanded = false;
      })

      highlighter.events.select.onClear.add(()=>{
        updatePropsTable({fragmentIdMap:{}});
        if(!floatingGrid) return;
        floatingGrid.layout = "main";
      })

      const search = (e:Event)=>{
        const input = e.target as BUI.TextInput;
        propsTable.queryString = input.value;
      }

      return BUI.html`
        <bim-panel>
          <bim-panel-section
            name="property"
            label="Property Information"
            icon="solar:document-bold"
            fixed
          >
            <bim-text-input @input=${search} placeholder="Search..."></bim-text-input>
            ${propsTable}  
          </bim-panel-section>
        </bim-panel>
      `
    })

    const toolbar = BUI.Component.create<BUI.Toolbar>(() => {
      const [loadIfcBtn] = CUI.buttons.loadIfc({ components: components });
      loadIfcBtn.tooltipTitle = "Load IFC";
      loadIfcBtn.label="";
      return BUI.html`
        <bim-toolbar style="justify-self: center;">
          <bim-toolbar-section label="Import">
            ${loadIfcBtn}
          </bim-toolbar-section>
           <bim-toolbar-section label="Fragments">
            <bim-button
              tooltip-title="Import"
              icon="mdi:cube"
              @click=${onFragmentImport}
            ></bim-button>
             <bim-button
              tooltip-title="Export"
              icon="tabler:package-export"
              @click=${onFragmentExport}
            ></bim-button>
            <bim-button
              tooltip-title="Dispose"
              icon="tabler:trash"
              @click=${onFragmentDispose}
            ></bim-button>
          </bim-toolbar-section>
          <bim-toolbar-section label="Selection">
            <bim-button 
              tooltip-title="Visibility" 
              icon="tabler:square-toggle" 
              @click=${onToggleVisibility}
            ></bim-button>
            <bim-button
              tooltip-title="Isolate"
              icon="prime:filter-fill"
              @click=${onIsolate}
            ></bim-button>
            <bim-button
              tooltip-title="Show All"
              icon="tabler:eye-filled"
              @click=${onShowAll}
            ></bim-button>
          </bim-toolbar-section>
          <bim-toolbar-section label="Property">
            <bim-button
              tooltip-title="Show"
              icon="material-symbols:list"
              @click=${onShowProperties}
            ></bim-button>
          </bim-toolbar-section>
          <bim-toolbar-section label="Groups">
            <bim-button
              tooltip-title="Classifier"
	            icon="tabler:eye-filled"
              @click=${onClassifier}
            ></bim-button>
          </bim-toolbar-section
        </bim-toolbar>
      `
    })

    floatingGrid.layouts = {
      main: {
        template: `
          "empty" 1fr
          "toolbar" auto
          /1fr
        `,
        elements: { toolbar },
      },
      second:{
        template: `
        "empty elementPropertyPanel" 1fr
        "toolbar toolbar" auto
        /1fr 20rem
      `,
      elements:{
        toolbar,
        elementPropertyPanel,
      }
      },
      classifier:{
        template: `
          "empty classifierPanel" 1fr
          "toolbar toolbar" auto
          /1fr 20rem
        `,
        elements: { 
          toolbar,
          classifierPanel
        },
      }
    }
    floatingGrid.layout = "main"

    viewerContainer.appendChild(floatingGrid)
  }

  React.useEffect(() => {
    setTimeout(()=>{
      setViewer()
      setupUI()
    })
    

    return () => {
      if (components) {
        components.dispose()
      }
      if (fragmentModel) {
        fragmentModel.dispose()
        fragmentModel = undefined
      }
    }
  }, [])
  return (
    <bim-viewport
    id="viewer-container"
    
  />
  )
}

export default IFCViewer
