import * as OBC from "@thatopen/components"
import { ToDoData, TodoInput } from "./bim-types";
import *  as THREE from "three";
import * as OBCF from "@thatopen/components-front";

export class TodoCreator extends OBC.Component {
    enabled: boolean = true;
    static uuid = "60b0538f-77b1-4411-80f8-83ad21177d9e";
    onTodoCreated = new OBC.Event<ToDoData>();
    private _world!: OBC.World;

    constructor(components: OBC.Components) {
        super(components);
        this.components.add(TodoCreator.uuid, this);
    }

    set world(world:OBC.World){
        this._world = world; //we need world to get camera position and target becouse in world is camera
    }

    addToDo(value:TodoInput){

        const fragmentManager = this.components.get(OBC.FragmentsManager);
        const highlighter = this.components.get(OBCF.Highlighter);
        const selection = highlighter.selection.select;
        const guids = fragmentManager.fragmentIdMapToGuids(selection);
        const camera = this._world.camera;
        if(!camera.hasCameraControls()) throw new Error("The world does not have camera control");

        const position = new THREE.Vector3();
        camera.controls.getPosition(position);
        const target = new THREE.Vector3();
        camera.controls.getTarget(target);

        const todoData: ToDoData = {
            name:value.name,
            task: value.task,
            ifcGuids:guids,
            camera:{position, target}
        }
        console.log(value);
        this.onTodoCreated.trigger(todoData);
    }

    async highlighterTodo(todo:ToDoData){
        const fragments = this.components.get(OBC.FragmentsManager);
        const fragmentIdMap = fragments.guidToFragmentIdMap(todo.ifcGuids);
        const highlighter = this.components.get(OBCF.Highlighter);
        highlighter.highlightByID("select", fragmentIdMap,true,false);

        if(!this._world){
            throw new Error("No world found");
        }
        if(!this._world.camera.hasCameraControls()) throw new Error("The world does not have camera control");
        await this._world.camera.controls.setLookAt(
            todo.camera.position.x,
            todo.camera.position.y,
            todo.camera.position.z,
            todo.camera.target.x,
            todo.camera.target.y,
            todo.camera.target.z,
            true
        )
    }
}