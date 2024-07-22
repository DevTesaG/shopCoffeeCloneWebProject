import { Routes } from '@angular/router';
import { VentaComponent } from './features/venta/venta/venta.component';
import { EventosComponent } from './features/eventos/eventos/eventos.component';
import { InventarioComponent } from './features/inventario/inventario.component';
import { RecetasComponent } from './features/recetas/recetas/recetas.component';
import { UsuariosComponent } from './features/usuarios/usuarios/usuarios.component';
import { adminGuard } from './core/guards/admin.guard';
import { LoginComponent } from './features/login/login.component';
import { FranquiciasComponent } from './features/usuarios/franquicias/franquicias.component';
import { loggedInGuard } from './core/guards/logged-in.guard';
import { HomeComponent } from './core/components/home/home.component';
import { isManagerGuard } from './core/guards/is-manager.guard';
import { IngredientesComponent } from './features/ingredientes/ingredientes.component';
import { ProductosComponent } from './features/productos/productos.component';
import { AdminHomeComponent } from './features/admin-home/admin-home.component';
import { InsumosComponent } from './features/insumos/insumos.component';
import { PreparacionProductosComponent } from './features/venta/preparacion-productos/preparacion-productos.component';
import { ImprimirComponent } from './features/venta/imprimir/imprimir.component';
import { InsumosOpcionesComponent } from './features/insumos-opciones/insumos-opciones.component';
import { BalanceComponent } from './features/ventas/balance/balance.component';
import { ProduccionComponent } from './features/produccion/produccion.component';


export const routes: Routes = [
    {path: "", pathMatch: 'full', redirectTo: 'login'},
    // {path: "login", component: LoginComponent, canDeactivate: [credentialsGuard]},
    {path: "login", component: LoginComponent},
    {path: "admin", component: AdminHomeComponent, children: [
        {path:'', pathMatch: 'full', redirectTo: 'franquicias'},
        {path: "franquicias",component: FranquiciasComponent, canActivate: [adminGuard]},
        {path: "ingredientes",component: IngredientesComponent, canActivate: [adminGuard]},
        {path: "productos",component: ProductosComponent, canActivate: [adminGuard]},
        {path: "eventos", component:EventosComponent, canActivate: [adminGuard]},
    ]},
    {path: "franquicias/:id", component: HomeComponent, canActivateChild: [loggedInGuard],  
    children: [
        {path:'', pathMatch:'full',redirectTo: 'ventas'},
        {path: "usuarios",component: UsuariosComponent, canActivate: [isManagerGuard]}, 
        {path: "inventarios", component: InventarioComponent, canActivate: [isManagerGuard]},
        {path: "insumos", component: InsumosComponent, canActivate:[isManagerGuard]},
        {path: "insumosOpciones", component: InsumosOpcionesComponent, canActivate:[isManagerGuard]},
        {path: "balances", component: BalanceComponent, canActivate:[isManagerGuard]},
        {path: "produccion", component: ProduccionComponent, canActivate:[isManagerGuard]},
        {path: "ventas", component: VentaComponent },
        {path: "preparacion", component: PreparacionProductosComponent },   
        {path: "recetas", component: RecetasComponent},
        {path: "imprimir",  component: ImprimirComponent},
    ]
    },
    {path: "**",  pathMatch: 'full',redirectTo: 'admin'}
];
