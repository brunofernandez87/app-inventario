import {
  obtenerHistorialGraficos,
  obtenerProyeccionesYRentabilidad,
  obtenerResumenMensual,
} from "@/service/reporte_mensual";
import { imprimirPDF } from "@/utils/impresora";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LogBox,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";

if (Platform.OS === "web") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const textoError = args.map(String).join(" ");
    if (
      textoError.includes("transform-origin") ||
      textoError.includes("transformOrigin") ||
      textoError.includes("onPressIn")
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

LogBox.ignoreLogs([
  "Invalid DOM property `transform-origin`",
  "Unknown event handler property `onPressIn`",
]);

const tabs = ["Resumen Mensual", "Proyecciones", "Rentabilidad"];

const chartConfigBarras = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  barPercentage: 0.6,
  decimalPlaces: 0,
};

const chartConfigLineas = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  strokeWidth: 3,
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#2563eb" },
  decimalPlaces: 0,
};

export default function ReportesScreen() {
  const [tabActiva, setTabActiva] = useState("Resumen Mensual");
  const [loading, setLoading] = useState(true);

  const [datosMensuales, setDatosMensuales] = useState({
    transacciones: 0,
    unidadesVendidas: 0,
    costosTotales: 0,
    gananciaNeta: 0,
  });
  const [historialGraficos, setHistorialGraficos] = useState({
    labels: ["-"],
    ganancias: [0],
    transacciones: [0],
  });

  const [proyecciones, setProyecciones] = useState<any[]>([]);
  const [rentabilidad, setRentabilidad] = useState<any[]>([]);
  const [resumenRentabilidad, setResumenRentabilidad] = useState({
    totalCosto: 0,
    totalPrecio: 0,
    gananciaPotencial: 0,
  });

  const ID_EMPRESA_ACTUAL = 1;

  useFocusEffect(
    useCallback(() => {
      const cargarReportes = async () => {
        setLoading(true);
        const [resumen, historial, extraData] = await Promise.all([
          obtenerResumenMensual(ID_EMPRESA_ACTUAL),
          obtenerHistorialGraficos(ID_EMPRESA_ACTUAL),
          obtenerProyeccionesYRentabilidad(ID_EMPRESA_ACTUAL),
        ]);

        setDatosMensuales(resumen);
        setHistorialGraficos(historial);
        setProyecciones(extraData.proyecciones);
        setRentabilidad(extraData.rentabilidad);
        setResumenRentabilidad(extraData.resumenRentabilidad);

        setLoading(false);
      };
      cargarReportes();
    }, []),
  );

  const generarPDF = async () => {
    try {
      setLoading(true);

      let htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              @page { size: auto; margin: 10mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #334155; }
              h1 { color: #0f172a; text-align: left; margin-bottom: 5px; font-size: 24px; }
              .fecha { text-align: left; color: #64748b; font-size: 13px; margin-bottom: 30px; }
              
              /* Cajas de resumen superior (Solo para mensual y rentabilidad) */
              .summary-container { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 30px; }
              .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; flex: 1; text-align: left; }
              .summary-box-green { background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; flex: 1; text-align: left; }
              .summary-box h3, .summary-box-green h3 { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; }
              .summary-box p { margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #0f172a; }
              .summary-box-green p { margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #16a34a; }
              
              /* Tablas clásicas perfectas */
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; border: 1px solid #cbd5e1; }
              th, td { border: 1px solid #cbd5e1; padding: 12px 10px; text-align: left; }
              th { background-color: #ffffff; color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 11px; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .val-green { color: #16a34a; font-weight: bold; }
              
              /* Badges (Etiquetas de color) */
              .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; }
              .ok { background-color: #d1fae5; color: #047857; }
              .bajo { background-color: #fef3c7; color: #b45309; }
              .sin { background-color: #f1f5f9; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="fecha">Generado el ${new Date().toLocaleDateString("es-AR")}</div>
      `;

      if (tabActiva === "Resumen Mensual") {
        const labelsInvertidos = [...historialGraficos.labels].reverse();
        const transaccionesInvertidas = [
          ...historialGraficos.transacciones,
        ].reverse();
        const gananciasInvertidas = [...historialGraficos.ganancias].reverse();

        htmlContent += `
            <h1>Reporte de Resumen Mensual</h1>
            <div class="summary-container">
              <div class="summary-box"><h3>Ventas del Mes</h3><p>${datosMensuales.transacciones}</p></div>
              <div class="summary-box"><h3>Prod. Vendidos</h3><p>${datosMensuales.unidadesVendidas}</p></div>
              <div class="summary-box"><h3>Costos Totales</h3><p>$ ${datosMensuales.costosTotales.toLocaleString("es-AR")}</p></div>
              <div class="summary-box"><h3>Ganancia Neta</h3><p>$ ${datosMensuales.gananciaNeta.toLocaleString("es-AR")}</p></div>
            </div>
            <h2 style="color: #0f172a; margin-top: 30px; font-size: 18px; text-align:left;">Desglose Mes a Mes</h2>
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th style="text-align: center;">Transacciones</th>
                  <th style="text-align: right;">Ingresos Totales</th>
                </tr>
              </thead>
              <tbody>
        `;

        labelsInvertidos.forEach((mes, index) => {
          const transacciones = transaccionesInvertidas[index];
          const ganancias = gananciasInvertidas[index];
          htmlContent += `
            <tr>
              <td><strong>${mes} ${index === 0 ? "(Actual)" : ""}</strong></td>
              <td style="text-align: center;">${transacciones} ventas</td>
              <td style="text-align: right;" class="val-green">$ ${ganancias.toLocaleString("es-AR")}</td>
            </tr>
          `;
        });
        htmlContent += `</tbody></table>`;
      } else if (tabActiva === "Proyecciones") {
        htmlContent += `
            <h1>Proyección por Producto</h1>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align:center;">Stock actual</th>
                  <th style="text-align:center;">Prom. mensual</th>
                  <th style="text-align:center;">Meses restantes</th>
                  <th style="text-align:center;">Estado</th>
                </tr>
              </thead>
              <tbody>
        `;
        proyecciones.forEach((prod) => {
          const claseEstado =
            prod.estado === "OK"
              ? "ok"
              : prod.estado === "Bajo"
                ? "bajo"
                : "sin";
          htmlContent += `
            <tr>
              <td><strong>${prod.nombre}</strong><br><span style="color:#64748b; font-size:11px;">${prod.codigo}</span></td>
              <td style="text-align:center;"><strong>${prod.stock}</strong> uds.</td>
              <td style="text-align:center;"><strong>${prod.prom}</strong></td>
              <td style="text-align:center;"><strong>${prod.meses}</strong></td>
              <td style="text-align:center;"><span class="badge ${claseEstado}">${prod.estado}</span></td>
            </tr>
          `;
        });
        htmlContent += `</tbody></table>`;
      } else if (tabActiva === "Rentabilidad") {
        htmlContent += `
            <h1>Rentabilidad por Producto</h1>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align:center;">Costo</th>
                  <th style="text-align:center;">Precio Venta</th>
                  <th style="text-align:center;">Ganancia ud.</th>
                  <th style="text-align:center;">Margen</th>
                  <th style="text-align:center;">Stock</th>
                  <th style="text-align:right;">Val. Costo total</th>
                </tr>
              </thead>
              <tbody>
        `;
        rentabilidad.forEach((prod) => {
          htmlContent += `
            <tr>
              <td><strong>${prod.nombre}</strong><br><span style="color:#64748b; font-size:11px;">${prod.codigoMarca}</span></td>
              <td style="text-align:center;">$ ${prod.costo.toLocaleString("es-AR")}</td>
              <td style="text-align:center;">$ ${prod.precio.toLocaleString("es-AR")}</td>
              <td style="text-align:center;" class="val-green">$ ${prod.ganancia.toLocaleString("es-AR")}</td>
              <td style="text-align:center;"><span class="badge ok">${prod.margen}</span></td>
              <td style="text-align:center;"><strong>${prod.stock}</strong> uds.</td>
              <td style="text-align:right; font-weight:bold;">$ ${prod.valCosto.toLocaleString("es-AR")}</td>
            </tr>
          `;
        });
        htmlContent += `</tbody></table>`;
      }

      htmlContent += `</body></html>`;

      await imprimirPDF(htmlContent);
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el documento PDF.");
    } finally {
      setLoading(false);
    }
  };

  const CardIndicador = ({ titulo, valor, subtitulo }: any) => (
    <View style={[styles.card, { flex: 1, minWidth: 140 }]}>
      <Text style={styles.cardTitulo}>{titulo}</Text>
      <Text style={styles.cardValor}>{valor}</Text>
      <Text style={styles.cardSub}>{subtitulo}</Text>
    </View>
  );

  const renderTabResumen = () => {
    if (loading)
      return (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 40 }}
        />
      );

    const dataGanancias = {
      labels: historialGraficos.labels,
      datasets: [
        {
          data:
            historialGraficos.ganancias.length > 0
              ? historialGraficos.ganancias
              : [0],
        },
      ],
    };

    const dataVentas = {
      labels: historialGraficos.labels,
      datasets: [
        {
          data:
            historialGraficos.transacciones.length > 0
              ? historialGraficos.transacciones
              : [0],
        },
      ],
    };

    const anchoGrafico = Platform.OS === "web" ? 400 : 320;
    const labelsInvertidos = [...historialGraficos.labels].reverse();
    const transaccionesInvertidas = [
      ...historialGraficos.transacciones,
    ].reverse();
    const gananciasInvertidas = [...historialGraficos.ganancias].reverse();
    const isWeb = Platform.OS === "web";

    return (
      <View style={styles.tabContent}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <CardIndicador
            titulo="VENTAS DEL MES"
            valor={datosMensuales.transacciones.toString()}
            subtitulo="transacciones"
          />
          <CardIndicador
            titulo="PRODUCTOS VENDIDOS"
            valor={datosMensuales.unidadesVendidas.toString()}
            subtitulo="unidades"
          />
          <CardIndicador
            titulo="COSTOS TOTALES"
            valor={`$ ${datosMensuales.costosTotales.toLocaleString("es-AR")}`}
            subtitulo="costo mercadería"
          />
          <CardIndicador
            titulo="GANANCIA NETA"
            valor={`$ ${datosMensuales.gananciaNeta.toLocaleString("es-AR")}`}
            subtitulo="ingresos - costos"
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <View
            style={[
              styles.card,
              { flex: 1, minWidth: anchoGrafico + 40, alignItems: "center" },
            ]}
          >
            <Text style={styles.cardTituloGrafico}>
              Ganancia Neta (Últimos 6 meses)
            </Text>
            <BarChart
              data={dataGanancias}
              width={anchoGrafico}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={chartConfigBarras}
              fromZero={true}
              style={{ borderRadius: 12, marginTop: 10 }}
            />
          </View>
          <View
            style={[
              styles.card,
              { flex: 1, minWidth: anchoGrafico + 40, alignItems: "center" },
            ]}
          >
            <Text style={styles.cardTituloGrafico}>Transacciones de Venta</Text>
            <LineChart
              data={dataVentas}
              width={anchoGrafico}
              height={220}
              yAxisLabel=""
              yAxisSuffix=" vtas"
              chartConfig={chartConfigLineas}
              bezier
              fromZero={true}
              withDots={!isWeb}
              style={{ borderRadius: 12, marginTop: 10 }}
            />
          </View>
        </View>

        <View style={[styles.tableCard, { marginTop: 10 }]}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Desglose Mes a Mes</Text>
            <Text style={styles.tableCardSub}>
              Historial numérico de los últimos 6 meses
            </Text>
          </View>
          <View style={{ paddingTop: 10 }}>
            {labelsInvertidos.map((mes, index) => (
              <View
                key={index}
                style={[
                  styles.cardMobile,
                  isWeb && {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                  },
                ]}
              >
                {isWeb ? (
                  <>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text
                        style={[
                          styles.rowTxtBase,
                          { fontWeight: "bold", fontSize: 16 },
                        ]}
                      >
                        {mes} {index === 0 && "(Actual)"}
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text style={styles.rowTxtBase}>
                        Transacciones:{" "}
                        <Text style={{ fontWeight: "bold" }}>
                          {transaccionesInvertidas[index]}
                        </Text>
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        alignItems: "flex-end",
                        paddingLeft: 10,
                      }}
                    >
                      <Text
                        style={[
                          styles.rowTxtBase,
                          {
                            color: "#16a34a",
                            fontWeight: "bold",
                            fontSize: 16,
                          },
                        ]}
                      >
                        Ingresos: ${" "}
                        {gananciasInvertidas[index].toLocaleString("es-AR")}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.cardRowMobile}>
                      <Text
                        style={[
                          styles.rowTxtBase,
                          { fontWeight: "bold", fontSize: 16 },
                        ]}
                      >
                        {mes} {index === 0 && "(Actual)"}
                      </Text>
                      <Text
                        style={[
                          styles.rowTxtBase,
                          {
                            color: "#16a34a",
                            fontWeight: "bold",
                            fontSize: 16,
                          },
                        ]}
                      >
                        $ {gananciasInvertidas[index].toLocaleString("es-AR")}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.cardRowMobile,
                        { marginTop: 4, marginBottom: 0 },
                      ]}
                    >
                      <Text style={styles.rowTxtSub}>
                        {transaccionesInvertidas[index]} transacciones
                      </Text>
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderTabProyecciones = () => {
    const isWeb = Platform.OS === "web";
    return (
      <View style={styles.tabContent}>
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Proyección por Producto</Text>
            <Text style={styles.tableCardSub}>
              Calculado en base al promedio histórico de ventas de los últimos 6
              meses
            </Text>
          </View>

          <View style={{ paddingTop: 10, width: "100%" }}>
            {proyecciones.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}
              >
                No hay productos registrados.
              </Text>
            ) : (
              proyecciones.map((prod) => (
                <View
                  key={prod.id}
                  style={[
                    styles.cardMobile,
                    isWeb && {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                    },
                  ]}
                >
                  {isWeb ? (
                    <>
                      <View style={{ flex: 2, paddingRight: 10 }}>
                        <Text
                          style={[
                            styles.rowTxtBase,
                            { fontWeight: "bold", fontSize: 16 },
                          ]}
                          numberOfLines={1}
                        >
                          {prod.nombre}
                        </Text>
                        <Text style={styles.rowTxtSub}>{prod.codigo}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={styles.rowTxtBase}>
                          Stock:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            {prod.stock} uds.
                          </Text>
                        </Text>
                      </View>
                      <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={styles.rowTxtBase}>
                          Promedio:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            {prod.prom}
                          </Text>
                        </Text>
                      </View>
                      <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={styles.rowTxtBase}>
                          Restan:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            {prod.meses}
                          </Text>
                        </Text>
                      </View>
                      <View style={{ flex: 0.8, alignItems: "flex-end" }}>
                        <View
                          style={
                            prod.estado === "OK"
                              ? styles.badgeOk
                              : prod.estado === "Bajo"
                                ? styles.badgeBajo
                                : styles.badgeSinHistorial
                          }
                        >
                          <Text
                            style={
                              prod.estado === "OK"
                                ? styles.badgeTxtOk
                                : prod.estado === "Bajo"
                                  ? styles.badgeTxtBajo
                                  : styles.badgeTxtSinHistorial
                            }
                          >
                            {prod.estado}
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.cardRowMobile}>
                        <Text
                          style={[
                            styles.rowTxtBase,
                            {
                              fontWeight: "bold",
                              fontSize: 16,
                              flex: 1,
                              marginRight: 8,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {prod.nombre}
                        </Text>
                        <View
                          style={
                            prod.estado === "OK"
                              ? styles.badgeOk
                              : prod.estado === "Bajo"
                                ? styles.badgeBajo
                                : styles.badgeSinHistorial
                          }
                        >
                          <Text
                            style={
                              prod.estado === "OK"
                                ? styles.badgeTxtOk
                                : prod.estado === "Bajo"
                                  ? styles.badgeTxtBajo
                                  : styles.badgeTxtSinHistorial
                            }
                          >
                            {prod.estado}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.rowTxtSub, { marginBottom: 8 }]}>
                        {prod.codigo}
                      </Text>
                      <View style={styles.cardRowMobile}>
                        <Text style={styles.rowTxtBase}>
                          Stock:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            {prod.stock} uds.
                          </Text>
                        </Text>
                        <Text style={styles.rowTxtBase}>
                          Restan:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            {prod.meses}
                          </Text>
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.cardRowMobile,
                          { marginTop: 4, marginBottom: 0 },
                        ]}
                      >
                        <Text style={styles.rowTxtBase}>
                          Promedio:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            {prod.prom}
                          </Text>
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTabRentabilidad = () => {
    const isWeb = Platform.OS === "web";
    return (
      <View style={styles.tabContent}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <View style={[styles.card, { flex: 1, minWidth: 200 }]}>
            <Text style={styles.cardTitulo}>VALOR STOCK A COSTO</Text>
            <Text style={styles.cardValor}>
              $ {resumenRentabilidad.totalCosto.toLocaleString("es-AR")}
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, minWidth: 200 }]}>
            <Text style={styles.cardTitulo}>VALOR STOCK A PRECIO VENTA</Text>
            <Text style={styles.cardValor}>
              $ {resumenRentabilidad.totalPrecio.toLocaleString("es-AR")}
            </Text>
          </View>
          <View style={[styles.cardPotencial, { flex: 1, minWidth: 200 }]}>
            <Text style={[styles.cardTitulo, { color: "#15803d" }]}>
              GANANCIA POTENCIAL EN STOCK
            </Text>
            <Text style={[styles.cardValor, { color: "#16a34a" }]}>
              $ {resumenRentabilidad.gananciaPotencial.toLocaleString("es-AR")}
            </Text>
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Rentabilidad por Producto</Text>
          </View>

          <View style={{ paddingTop: 10, width: "100%" }}>
            {rentabilidad.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}
              >
                No hay productos registrados.
              </Text>
            ) : (
              rentabilidad.map((prod) => (
                <View
                  key={prod.id}
                  style={[
                    styles.cardMobile,
                    isWeb && {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                    },
                  ]}
                >
                  {isWeb ? (
                    <>
                      <View
                        style={{
                          flex: 2,
                          paddingRight: 10,
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={[
                            styles.rowTxtBase,
                            { fontWeight: "bold", fontSize: 16 },
                          ]}
                          numberOfLines={1}
                        >
                          {prod.nombre}
                        </Text>
                        <Text style={styles.rowTxtSub}>{prod.codigoMarca}</Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={styles.rowTxtSub}>Costo</Text>
                        <Text
                          style={[styles.rowTxtBase, { fontWeight: "bold" }]}
                        >
                          $ {prod.costo.toLocaleString("es-AR")}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={styles.rowTxtSub}>Precio Venta</Text>
                        <Text
                          style={[styles.rowTxtBase, { fontWeight: "bold" }]}
                        >
                          $ {prod.precio.toLocaleString("es-AR")}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={styles.rowTxtSub}>Ganancia ud.</Text>
                        <Text
                          style={[
                            styles.rowTxtBase,
                            { fontWeight: "bold", color: "#16a34a" },
                          ]}
                        >
                          + $ {prod.ganancia.toLocaleString("es-AR")}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 0.8,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View style={styles.badgeOk}>
                          <Text style={styles.badgeTxtOk}>{prod.margen}</Text>
                        </View>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={styles.rowTxtSub}>Stock</Text>
                        <Text
                          style={[styles.rowTxtBase, { fontWeight: "bold" }]}
                        >
                          {prod.stock} uds.
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1.2,
                          alignItems: "flex-end",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={styles.rowTxtSub}>Val. Costo total</Text>
                        <Text
                          style={[styles.rowTxtBase, { fontWeight: "bold" }]}
                        >
                          $ {prod.valCosto.toLocaleString("es-AR")}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.cardRowMobile}>
                        <Text
                          style={[
                            styles.rowTxtBase,
                            {
                              fontWeight: "bold",
                              fontSize: 16,
                              flex: 1,
                              marginRight: 8,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {prod.nombre}
                        </Text>
                        <View style={styles.badgeOk}>
                          <Text style={styles.badgeTxtOk}>{prod.margen}</Text>
                        </View>
                      </View>
                      <Text style={[styles.rowTxtSub, { marginBottom: 12 }]}>
                        {prod.codigoMarca}
                      </Text>

                      <View style={styles.cardRowMobile}>
                        <Text style={styles.rowTxtBase}>
                          Costo:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            $ {prod.costo.toLocaleString("es-AR")}
                          </Text>
                        </Text>
                        <Text style={styles.rowTxtBase}>
                          Precio:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            $ {prod.precio.toLocaleString("es-AR")}
                          </Text>
                        </Text>
                      </View>

                      <View style={[styles.cardRowMobile, { marginTop: 8 }]}>
                        <Text style={styles.rowTxtBase}>
                          Stock:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            {prod.stock} uds.
                          </Text>
                        </Text>
                        <Text style={styles.rowTxtBase}>
                          Valor total:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            $ {prod.valCosto.toLocaleString("es-AR")}
                          </Text>
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.cardRowMobile,
                          { marginTop: 8, marginBottom: 0 },
                        ]}
                      >
                        <Text style={[styles.rowTxtBase, { color: "#16a34a" }]}>
                          Ganancia/ud:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            + $ {prod.ganancia.toLocaleString("es-AR")}
                          </Text>
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tituloPrincipal}>Reportes</Text>
        <TouchableOpacity style={styles.btnImprimirGlobal} onPress={generarPDF}>
          <Text style={styles.txtImprimirGlobal}>Imprimir / PDF</Text>
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
        >
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  tabActiva === tab && styles.tabButtonActive,
                ]}
                onPress={() => setTabActiva(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    tabActiva === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {tabActiva === "Resumen Mensual" && renderTabResumen()}
          {tabActiva === "Proyecciones" && renderTabProyecciones()}
          {tabActiva === "Rentabilidad" && renderTabRentabilidad()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8", padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  tituloPrincipal: { fontSize: 28, fontWeight: "bold", color: "#0f172a" },
  btnImprimirGlobal: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  txtImprimirGlobal: { color: "#475569", fontWeight: "600" },
  tabsScroll: { marginBottom: 20 },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    gap: 8,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#0f172a",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderBottomWidth: 0,
  },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#0f172a" },
  tabContent: { paddingBottom: 40 },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardPotencial: {
    backgroundColor: "#ecfdf5",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  cardTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardTituloGrafico: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
  },
  cardValor: { fontSize: 24, fontWeight: "bold", color: "#0f172a" },
  cardSub: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  tableCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  tableCardHeader: { marginBottom: 10 },
  tableCardTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  tableCardSub: { fontSize: 13, color: "#64748b", marginTop: 4 },

  cardMobile: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardRowMobile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowTxtBase: { fontSize: 14, color: "#334155" },
  rowTxtSub: { fontSize: 13, color: "#94a3b8", marginTop: 2 },

  badgeOk: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTxtOk: { color: "#047857", fontSize: 12, fontWeight: "bold" },
  badgeBajo: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTxtBajo: { color: "#b45309", fontSize: 12, fontWeight: "bold" },
  badgeSinHistorial: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTxtSinHistorial: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" },
});
