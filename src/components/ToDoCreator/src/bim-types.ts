import *  as THREE from "three";

export interface TodoInput{
    name:string,
    task:string
}

export interface ToDoData{
    name:string,
    task:string,
    ifcGuids: string[],
    camera:{position: THREE.Vector3, target:THREE.Vector3}
} 