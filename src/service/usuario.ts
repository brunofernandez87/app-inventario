import { supabase } from '../database/supabase';
import { Usuario } from '../types/types';

// OBTENER un usuario (para cuando el dueño quiere ver cosas de un usuario en especifico)
export const obtenerUsuario = async (id_Usuario: number): Promise<Usuario | null> => {
  try {
    const { data, error } = await supabase.from('usuario').select('*').eq('id_usuario', id_Usuario).single();
    if (error) throw error;
    return data as Usuario;
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return null;
  }
};

// OBTENER TODOS los usuarios de una empresa (Para listar en pantalla)
export const obtenerUsuariosPorEmpresa = async (id_Empresa: number): Promise<Usuario[]> => {
  try {
    const { data, error } = await supabase.from('usuario').select('*').eq('id_empresa', id_Empresa);
    if (error) throw error;
    return data as Usuario[];
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
};

// CREAR un usuario virtual desde la app
// Usamos Omit para decirle que no necesitamos mandarle el id_usuario (porque la base de datos lo crea solo)
export const crearUsuario = async (nuevoUsuario: Omit<Usuario, 'id_usuario'>): Promise<boolean> => {
  try {
    const { error } = await supabase.from('usuario').insert(nuevoUsuario);
    if (error) throw error;
    return true; // Se creó con éxito
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return false;
  }
};

// EDITAR un usuario (Exige que pertenezca a la misma empresa y que quien edita sea Admin)
// Usamos Partial porque quizás solo queremos enviarle { bonificacion: X% } y no todos los datos
export const editarUsuario = async (
  id_UsuarioAEditar: number, 
  id_Empresa: number,
  rol_UsuarioActual: string, // Pedimos el rol para validar
  datosAActualizar: Partial<Usuario> // Los datos nuevos (bonificación, nombre, etc.)
): Promise<boolean> => {
  
  // Verificamos el rol para asegurarnos de que sea Admin
  if (rol_UsuarioActual !== "Admin") {
    console.warn("Acción denegada: Solo los administradores pueden editar usuarios.");
    return false; // Corta la ejecución
  }

  //  Verificamos que sea de la misma empresa
  try {
    const { error } = await supabase
      .from('usuario')
      .update(datosAActualizar)
      .eq('id_usuario', id_UsuarioAEditar)
      .eq('id_empresa', id_Empresa);

    if (error) throw error;
    return true; // Se actualizó con éxito
  } catch (error) {
    console.error("Error al editar usuario:", error);
    return false;
  }
};

// ELIMINAR un usuario (Exige que pertenezca a la misma empresa y que quien borra sea Admin)
export const eliminarUsuario = async (
  id_UsuarioAEliminar: number, 
  id_Empresa: number,
  rol_UsuarioActual: string
): Promise<boolean> => {
  
  // Verificamos el rol para asegurarnos de que sea Admin
  if (rol_UsuarioActual !== "Admin") {
    console.warn("Acción denegada: Solo los administradores pueden eliminar usuarios.");
    return false;
  }

  //  Verificamos que sea de la misma empresa
  try {
    const { error } = await supabase
      .from('usuario')
      .delete()
      .eq('id_usuario', id_UsuarioAEliminar)
      .eq('id_empresa', id_Empresa); 

    if (error) throw error;
    return true; 
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return false;
  }
};