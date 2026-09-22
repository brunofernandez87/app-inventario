import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  console.log("🟢 --- INICIANDO CIERRE DIARIO ---");
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Obtener la fecha de hoy en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0]

    // 1. Obtener todas las empresas activas
    const { data: empresas, error: errEmpresas } = await supabase
      .from('empresa')
      .select('id_empresa, nombre_empresa')
      .eq('activo', true)

    if (errEmpresas) throw errEmpresas;

    for (const empresa of empresas) {
      console.log(`📊 Procesando cierre para: ${empresa.nombre_empresa}`);

      // 2. Calcular total de ventas y monto del día para esta empresa
      const { data: ventas, error: errVentas } = await supabase
        .from('venta')
        .select('total')
        .eq('id_empresa', empresa.id_empresa)
        .gte('fecha_venta', `${hoy}T00:00:00Z`) // Desde el principio del día
        .lt('fecha_venta', `${hoy}T23:59:59Z`) // Hasta el final del día

      if (errVentas) {
         console.error(`Error obteniendo ventas para ${empresa.nombre_empresa}:`, errVentas);
         continue; 
      }

      const cantidadVentas = ventas.length;
      
      // Si no hubo ventas, no mandamos notificación para no molestar
      if (cantidadVentas === 0) {
        console.log(`😴 Sin ventas hoy para ${empresa.nombre_empresa}. Omitiendo notificación.`);
        continue;
      }

      const totalObtenido = ventas.reduce((acc, venta) => acc + (venta.total || 0), 0);

      // 3. Buscar tokens de los Admins y Socios de esta empresa
      const { data: tokensData, error: errTokens } = await supabase
        .from('usuario_tokens')
        .select('expo_push_token, usuario!inner(rol)')
        .eq('id_empresa', empresa.id_empresa)
        .in('usuario.rol', ['Admin', 'Socio'])

      if (errTokens || !tokensData || tokensData.length === 0) {
        console.log(`⚠️ Sin tokens para notificar en ${empresa.nombre_empresa}`);
        continue;
      }

      const tokens = tokensData.map((t: any) => t.expo_push_token)

      // 4. Armar y enviar el mensaje
      const mensajePush = {
        to: tokens,
        sound: 'default',
        title: '📊 Resumen de Cierre Diario',
        body: `Cierre: ${cantidadVentas} ventas registradas. Total obtenido: $${totalObtenido.toLocaleString('es-AR')}`,
      }

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mensajePush),
      })
      
      console.log(`✅ Notificación enviada para ${empresa.nombre_empresa}`);
    }

    return new Response(JSON.stringify({ exito: true, mensaje: "Cierre diario completado." }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("❌ Error CRÍTICO en cierre diario:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})