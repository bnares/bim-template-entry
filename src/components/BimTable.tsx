import React, { useEffect, useRef } from 'react'
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front"
import { TodoCreator } from './ToDoCreator/src/ToDoCreator';
import "../test.css"
import { ToDoData } from './ToDoCreator/src/bim-types';
interface BimTableData{
    components:OBC.Components
}

const BimTable = (props:BimTableData) => {
    const {components} = props;
    const dashboard = React.useRef<HTMLDivElement>(null);
    //const tableRef = useRef<BUI.Table>(null);

    const onRowCreated = (event)=>{
        event.stopImmediatePropagation();
        const {row} = event.detail;
        console.log("row: ",row);
        row.addEventListener("click",()=>{
            todoCreator.highlighterTodo({
                name:row.data.Name,
                task:row.data.Task,
                ifcGuids:JSON.parse(row.data.Guids),
                camera:JSON.parse(row.data.Camera)
            })
           
        })

        row.addEventListener("mouseenter",()=>{
            row.style.backgroundColor="#f0f0f0"
            //row.classList.add("hovered")
        })

        row.addEventListener("mouseleave",()=>{
            row.style.backgroundColor=""
            //row.classList.remove("hovered");
        })
    }

    const todoTable = BUI.Component.create<BUI.Table>(()=>{

        return BUI.html`
            <bim-table @rowcreated=${onRowCreated}></bim-table>
        `
    })

    const addTodo = (data:ToDoData)=>{
        if(!todoTable) return;
        const newData = {
            data:{
                Name:data.name,
                Task:data.task,
                Date: new Date().toDateString(),
                Guids:JSON.stringify(data.ifcGuids),
                Camera:data.camera ? (JSON.stringify(data.camera)) : "",
            }
        }
        todoTable.data = [...todoTable.data, newData];
        todoTable.hiddenColumns = ["Guids","Camera"];
        //todoTable.hiddenColumns = [];
    }

    const todoCreator = components.get(TodoCreator);
    todoCreator.onTodoCreated.add((data)=>addTodo(data));

    useEffect(()=>{
        dashboard.current?.appendChild(todoTable);
    },[])

  return (
    <div ref={dashboard}>
      {/* <bim-table id="todo-table" ref={tableRef}></bim-table> */}
    </div>
  )
}

export default BimTable

