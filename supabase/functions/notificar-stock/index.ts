import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  console.log("🟢 --- WEBHOOK RECIBIDO ---");
  try {
    const payload = await req.json()
    console.log("📦 Payload:", JSON.stringify(payload));

    const productoAnterior = payload.old_record
    const productoNuevo = payload.record

    // 1. FILTRO INTELIGENTE
    if (
      !productoNuevo.alerta_stock || 
      productoAnterior.stock_unidades <= productoNuevo.stock_minimo ||
      productoNuevo.stock_unidades > productoNuevo.stock_minimo
    ) {
      console.log(`🛑 Filtro NO superado. Alerta: ${productoNuevo.alerta_stock}, Stock viejo: ${productoAnterior?.stock_unidades}, Stock nuevo: ${productoNuevo?.stock_unidades}`);
      return new Response(JSON.stringify({ mensaje: "No requiere alerta." }), { status: 200 })
    }

    console.log("✅ Filtro superado. Buscando tokens en Supabase...");

    // 2. Conexión a la base de datos
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. Buscamos los tokens de los Admins y Socios
    const { data: tokensData, error } = await supabase
      .from('usuario_tokens')
      .select('expo_push_token, usuario!inner(rol)')
      .eq('id_empresa', productoNuevo.id_empresa)
      .in('usuario.rol', ['Admin', 'Socio'])

    if (error) {
      console.error("❌ Error buscando tokens en BD:", error);
      throw error;
    }

    const tokens = tokensData.map((t: any) => t.expo_push_token)
    console.log("📱 Tokens encontrados:", tokens);

    if (tokens.length === 0) {
      console.log("⚠️ No hay dispositivos Admin/Socio registrados para notificar.");
      return new Response(JSON.stringify({ mensaje: "Sin dispositivos para notificar." }), { status: 200 })
    }

    // 4. Armamos el mensaje para el celular
    const mensajePush = {
      to: tokens, 
      sound: 'default',
      title: '⚠️ Stock Crítico',
      body: `El producto "${productoNuevo.nombre_producto}" llegó a su límite. Quedan ${productoNuevo.stock_unidades} unidades.`,
    }

    console.log("🚀 Enviando mensaje a Expo:", mensajePush);

    // 5. Lo enviamos a través de los servidores de Expo
    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mensajePush),
    })

    const expoData = await expoRes.json()
    console.log("📬 Respuesta de Expo:", expoData);

    return new Response(JSON.stringify({ exito: true, data: expoData }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("❌ Error CRÍTICO en la función:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})