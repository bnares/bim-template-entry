import * as OBC from "@thatopen/components"
import { TodoCreator } from "./ToDoCreator";
import * as BUI from "@thatopen/ui"
import * as OBCF from "@thatopen/components-front"
import { nanoid } from "nanoid";
import { ToDoData, TodoInput } from "./bim-types";
export interface TodoUIState{
    components: OBC.Components,
}

export const todoTool = (state: TodoUIState)=>{
    const {components} = state;
    const todoCreator = components.get(TodoCreator);

    const todoModel = BUI.Component.create<HTMLDialogElement>(()=>{

        const nameINput = document.createElement("bim-text-input");
        nameINput.label = "Name";
        const taskInput = document.createElement("bim-text-input");
        taskInput.label = "Task";

        return BUI.html`
            <dialog>
                <bim-panel style="width: 20rem">
                    <bim-panel-section label="To-Do" fixed>
                        <bim-label>
                            Create to do for future
                        </bim-label>
                        ${nameINput}
                        ${taskInput}
                        <bim-button
                            @click=${()=>{
                                
                                const toDoValue : TodoInput = {
                                    name: nameINput.value,
                                    task:taskInput.value,
                                };
                                todoCreator.addToDo(toDoValue);
                                nameINput.value="";
                                taskInput.value="";
                                todoModel.close();
                            }}
                            label="Create to do"
                        >
                            
                        </bim-button>
                    </bim-panel-section>
                </bim-panel>
            </dialog>
        `
    })

    document.body.appendChild(todoModel);

    return BUI.Component.create<BUI.Button>(()=>{

        return BUI.html`
            <bim-button
                @click=${()=>todoModel.showModal()}
                icon="pajamas:todo-done"
                tooltip-title="To-Do"
            ></bim-button>
        `
    })
}