import { Inject, Injectable,  } from '@angular/core';
import { CollectionReference, DocumentData, DocumentReference, Firestore, QueryFieldFilterConstraint, WriteBatch, addDoc, collection, collectionData, deleteDoc, doc, docData, query, setDoc, updateDoc, where, writeBatch } from '@angular/fire/firestore';
import { Observable, catchError, defer, first, forkJoin, from, map, merge, of, take, tap } from 'rxjs';



@Injectable()
export class CrudService {

  private coleccion: CollectionReference<DocumentData>
  private docRef?: DocumentReference<DocumentData>
  private rutaApi:string = "usuario";
  private rutaFranquiciaApi:string = 'franquiciasDatos';

  constructor(private firestore: Firestore) { 
    console.log(this.rutaApi)
    this.coleccion = collection(this.firestore, this.rutaApi)
  }

  get firestoreInstancia(){
    return this.firestore
  }

  get rutaFranquicia(){
    return this.rutaFranquiciaApi
  }

  setRuta(ruta: string, franquiciaId?:string){
    this.rutaApi = ruta
    this.coleccion = franquiciaId ? collection(this.firestore,this.rutaFranquiciaApi,franquiciaId, this.rutaApi):  collection(this.firestore, this.rutaApi)
    return this
  }

  get ruta(){
    return this.coleccion
  }

  get obtenerNuevoLote(){
    return writeBatch(this.firestore)
  }


  executeBatch(franquiciaId:string, updateArray: any[]){
    var batch:WriteBatch = writeBatch(this.firestore)
    const batches:Promise<void>[] = [];
    
    updateArray.forEach((o, idx)=> {
      this.setRuta(o.ruta, franquiciaId)
      const {id, ...doc} = o.doc
      batch.set(doc(this.coleccion, id), {...doc})

      if(idx== updateArray.length - 1 ||  idx % 450 == 0){
        batches.push(new Promise(() => batch.commit()))
        batch = writeBatch(this.firestore)
      }
    })

    return forkJoin([...batches])
  }

  crear<S>(newDoc: S, id?:string, franquiciaId?:string): Observable<string | any>{
    var add$
    if(id && franquiciaId){ 
      console.log('add franquicia datos')
      this.docRef = doc(this.firestore,this.rutaFranquiciaApi,franquiciaId,this.rutaApi,id)
      add$ =  from(setDoc(this.docRef, {...newDoc} as object)) as Observable<any>
    }else if(franquiciaId){
      this.coleccion = collection(this.firestore, this.rutaFranquiciaApi, franquiciaId, this.rutaApi)
      add$ = from(addDoc(this.coleccion, {...newDoc} as object)) as Observable<any>
    }else if(id){ 
      this.docRef = doc(this.firestore, this.rutaApi,id)
      add$ =  from(setDoc(this.docRef, {...newDoc} as object)) as Observable<any>
    }else{
      add$ = from(addDoc(this.coleccion, {...newDoc} as object)) as Observable<any>
    }
    
    return add$.pipe(map(ref =>ref?.id ? ref.id: ref)) as Observable<string>     
  }

  obtenerEstado(franquiciaId:string){
    return docData(doc(this.firestore, this.rutaFranquiciaApi,franquiciaId)).pipe(take(1)) as Observable<any>
  }

  actualizarEstado(franquiciaId:string, nuevoEstado:any){
    return from(setDoc(doc(this.firestore, this.rutaFranquiciaApi,franquiciaId),{...nuevoEstado})) as Observable<any>
  }

  actualizar<S>(id: string, newDoc: S, key?:string): Observable<any>{
    this.docRef = doc(this.coleccion, id)
    
    return from(setDoc(this.docRef, newDoc as Object, {merge:true})).pipe(take(1), tap({complete: ()=> console.log('Crud Operation Complete'), error: console.error}))
  }



  eliminar<S>(id: string): Observable<any> {
    console.log(this.coleccion,id)
    return from(deleteDoc(doc(this.coleccion, id))).pipe(first(), tap((i)=> console.log('crud delete ran', i)))
  }




  obtenerPorId<S>(id: string): Observable<S>{


    return docData(doc(this.firestore, this.rutaApi, id), {idField:'id'}).pipe(take(1), tap({complete: ()=> console.log('Crud Operation Complete')})) as Observable<S>
  }


  obtenerPorCampo(key: string, value:any): Observable<any>{
    return collectionData(query(this.coleccion, where(key, "==",value)), {idField: 'id',  serverTimestamps: 'estimate'})
  }
  
  obtenerPorQuery(queries: QueryFieldFilterConstraint[]){
    return collectionData(query(this.coleccion, ...queries), {idField: 'id',  serverTimestamps: 'estimate'})
  }

  obtenerTodos<S>(key?:string, value?:string):Observable<S[]>{
    var values$ = key && value ? this.obtenerPorCampo(key, value): collectionData(this.coleccion, {idField: 'id', serverTimestamps: 'estimate'});
  
    return  values$.pipe(take(1),tap(()=>console.log('firebase')), tap({complete: ()=> console.log('Crud Operation Complete')})) as Observable<S[]>
  }


}


// export function crudServiceFactory(api: any): CrudService {

//   let rutaApi: string = "";
//   let rutas: Array<string> = ['usuario', 'productos', 'ingredientes', 'ordenesVenta', 'ordenesCompra', 'proveedores', 'inventarios', 'caja', 'recetas']

//   if(rutas.includes(api)){
//     rutaApi = api
//   }

//   return new CrudService(inject(Firestore), rutaApi);
// }