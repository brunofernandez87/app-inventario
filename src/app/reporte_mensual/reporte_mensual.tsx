import {
  obtenerListaPrecios,
  obtenerVentasRevendedores,
} from "@/service/reporte_mensual";
import { Producto, StockRevendedor, Usuario } from "@/types/types";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ReporteMensualScreen() {
  const [tabActiva, setTabActiva] = useState<"Revendedores" | "ListaPrecios">(
    "Revendedores",
  );
  const [loading, setLoading] = useState(false);

  // Estados
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [ventas, setVentas] = useState<StockRevendedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const ID_EMPRESA_ACTUAL = 1;

  useEffect(() => {
    cargarDatos();
  }, [tabActiva]);

  const cargarDatos = async () => {
    setLoading(true);
    if (tabActiva === "Revendedores") {
      const data = await obtenerVentasRevendedores(ID_EMPRESA_ACTUAL);
      setUsuarios(data.usuarios);
      setVentas(data.ventas);
    } else {
      const data = await obtenerListaPrecios(ID_EMPRESA_ACTUAL);
      setProductos(data);
    }
    setLoading(false);
  };

  // ==========================================
  // LÓGICA DE PDF - LISTA DE PRECIOS
  // ==========================================
  const imprimirListaPrecios = async () => {
    // REQUERIMIENTO: Al imprimir, la columna "Código" NO debe salir.
    const filasHtml = productos
      .map(
        (p) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.nombre_producto}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.marca || "-"}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${p.precio_venta || 0}</td>
      </tr>
    `,
      )
      .join("");

    const html = `
      <html>
        <body style="font-family: Helvetica, Arial, sans-serif; padding: 20px;">
          <h2>Lista de Precios</h2>
          <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Producto</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Marca</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Precio Público</th>
              </tr>
            </thead>
            <tbody>${filasHtml}</tbody>
          </table>
        </body>
      </html>
    `;
    await generarYCompartirPDF(html);
  };

  // ==========================================
  // LÓGICA DE PDF - REVENDEDORES
  // ==========================================
  const imprimirReporteRevendedores = async (idUsuarioEspecifico?: number) => {
    const usuariosAImprimir = idUsuarioEspecifico
      ? usuarios.filter((u) => u.id_usuario === idUsuarioEspecifico)
      : usuarios;

    let contenidoHtml = `<html><body style="font-family: sans-serif; padding: 20px;">
      <h2>Reporte de Ventas - Revendedores</h2>`;

    usuariosAImprimir.forEach((u) => {
      const ventasUsuario = ventas.filter((v) => v.id_usuario === u.id_usuario);
      if (ventasUsuario.length === 0) return; // Si no vendió nada, saltamos

      contenidoHtml += `
        <h3 style="margin-top: 20px; color: #2563eb;">${u.nombre_usuario} (Rol: ${u.rol})</h3>
        <table style="width: 100%; text-align: left; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px;">Producto</th>
            <th style="padding: 8px;">Cant. Vendida</th>
            <th style="padding: 8px;">Precio Unit.</th>
            <th style="padding: 8px;">Subtotal</th>
          </tr>
      `;

      let totalVendido = 0;
      ventasUsuario.forEach((v) => {
        const prod = (v as any).producto;
        const subtotal = v.cantidad * (prod?.precio_venta || 0);
        totalVendido += subtotal;

        contenidoHtml += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${prod?.nombre_producto}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${v.cantidad}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${prod?.precio_venta || 0}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${subtotal}</td>
          </tr>
        `;
      });
      contenidoHtml += `
          <tr><td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">TOTAL:</td>
          <td style="padding: 8px; font-weight: bold;">$${totalVendido}</td></tr>
        </table>
      `;
    });

    contenidoHtml += "</body></html>";
    await generarYCompartirPDF(contenidoHtml);
  };

  const generarYCompartirPDF = async (html: string) => {
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el PDF");
    }
  };

  // ==========================================
  // RENDER - PESTAÑAS
  // ==========================================
  return (
    <View className="flex-1 bg-gray-100 p-4">
      {/* TABS HEADER */}
      <View className="flex-row mb-4 border-b border-gray-300">
        <TouchableOpacity
          className={`pb-2 mr-6 ${tabActiva === "Revendedores" ? "border-b-2 border-blue-600" : ""}`}
          onPress={() => setTabActiva("Revendedores")}
        >
          <Text
            className={`text-lg font-bold ${tabActiva === "Revendedores" ? "text-blue-600" : "text-gray-500"}`}
          >
            Revendedores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`pb-2 ${tabActiva === "ListaPrecios" ? "border-b-2 border-blue-600" : ""}`}
          onPress={() => setTabActiva("ListaPrecios")}
        >
          <Text
            className={`text-lg font-bold ${tabActiva === "ListaPrecios" ? "text-blue-600" : "text-gray-500"}`}
          >
            Lista de Precios
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
      ) : (
        <ScrollView className="flex-1">
          {tabActiva === "Revendedores" && (
            <View>
              <TouchableOpacity
                className="bg-blue-600 p-3 rounded-lg self-end mb-4 shadow"
                onPress={() => imprimirReporteRevendedores()}
              >
                <Text className="text-white font-bold">
                  Imprimir Todos (PDF)
                </Text>
              </TouchableOpacity>

              {usuarios.map((u) => {
                const ventasUser = ventas.filter(
                  (v) => v.id_usuario === u.id_usuario,
                );
                return (
                  <View
                    key={u.id_usuario}
                    className="bg-white p-4 mb-4 rounded-xl shadow-sm border border-gray-200"
                  >
                    <View className="flex-row justify-between items-center mb-3 border-b border-gray-100 pb-2">
                      <View>
                        <Text className="text-lg font-bold text-gray-900">
                          {u.nombre_usuario}
                        </Text>
                        <Text className="text-sm text-gray-500">{u.rol}</Text>
                      </View>
                      <TouchableOpacity
                        className="border border-blue-600 px-3 py-1 rounded"
                        onPress={() =>
                          imprimirReporteRevendedores(u.id_usuario)
                        }
                      >
                        <Text className="text-blue-600 font-bold text-xs">
                          Imprimir Este
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* REQUERIMIENTO: Agregar Columna Precio */}
                    <View className="flex-row justify-between bg-gray-50 p-2 mb-2 rounded">
                      <Text className="font-bold flex-1">Producto</Text>
                      <Text className="font-bold w-16 text-center">Cant</Text>
                      <Text className="font-bold w-20 text-right">Precio</Text>
                    </View>

                    {ventasUser.length === 0 ? (
                      <Text className="text-gray-400 italic py-2">
                        Sin ventas registradas.
                      </Text>
                    ) : (
                      ventasUser.map((v) => (
                        <View
                          key={v.id_registro}
                          className="flex-row justify-between border-b border-gray-100 py-2"
                        >
                          <Text className="flex-1 text-gray-700">
                            {(v as any).producto?.nombre_producto}
                          </Text>
                          <Text className="w-16 text-center text-gray-700">
                            {v.cantidad}
                          </Text>
                          <Text className="w-20 text-right text-gray-700">
                            ${(v as any).producto?.precio_venta}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {tabActiva === "ListaPrecios" && (
            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold">Catálogo de Productos</Text>
                <TouchableOpacity
                  className="bg-blue-600 px-4 py-2 rounded-lg"
                  onPress={imprimirListaPrecios}
                >
                  <Text className="text-white font-bold">
                    Imprimir Lista (PDF)
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row border-b border-gray-300 pb-2 mb-2">
                <Text className="font-bold w-20">Código</Text>
                <Text className="font-bold flex-1">Producto</Text>
                <Text className="font-bold w-24 text-right">P. Público</Text>
                {/* REQUERIMIENTO: Ocultar visualmente las columnas de precios con descuento (NO LAS RENDERIZAMOS) */}
              </View>

              {productos.map((p) => (
                <View
                  key={p.id_producto}
                  className="flex-row border-b border-gray-100 py-3 items-center"
                >
                  <Text className="w-20 text-gray-500 text-sm">
                    {p.codigo_barras || "-"}
                  </Text>
                  <Text className="flex-1 text-gray-800 font-semibold">
                    {p.nombre_producto}
                  </Text>
                  <Text className="w-24 text-right text-gray-900 font-bold">
                    ${p.precio_venta}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
