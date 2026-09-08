import { useEmpresa } from "@/context/empresaContext";
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
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
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
      textoError.includes("onPressIn") ||
      textoError.includes("onResponderTerminate") ||
      textoError.includes("onResponderRelease") ||
      textoError.includes("onResponderMove") ||
      textoError.includes("onStartShouldSetResponder") ||
      textoError.includes("onResponderGrant") ||
      textoError.includes("onResponderTerminationRequest")
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

LogBox.ignoreLogs([
  "Invalid DOM property `transform-origin`",
  "Unknown event handler property `onPressIn`",
  "Unknown event handler property `onResponderTerminate`",
  "Unknown event handler property `onResponderRelease`",
  "Unknown event handler property `onResponderMove`",
  "Unknown event handler property `onStartShouldSetResponder`",
  "Unknown event handler property `onResponderGrant`",
  "Unknown event handler property `onResponderTerminationRequest`",
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
  const { empresa } = useEmpresa();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [tabActiva, setTabActiva] = useState("Resumen Mensual");
  const [loading, setLoading] = useState(true);

  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const formatoYYYYMMDD = (d: Date) =>
    `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;

  const [fechaInicio, setFechaInicio] = useState(formatoYYYYMMDD(primerDia));
  const [fechaFin, setFechaFin] = useState(formatoYYYYMMDD(hoy));
  const [mesExpandido, setMesExpandido] = useState<number | null>(null);

  const [datosMensuales, setDatosMensuales] = useState({
    transacciones: 0,
    unidadesVendidas: 0,
    costosTotales: 0,
    gananciaNeta: 0,
  });
  const [historialGraficos, setHistorialGraficos] = useState<any>({
    labels: Array(12).fill("-"),
    ganancias: Array(12).fill(0),
    transacciones: Array(12).fill(0),
    ventasPorMes: {},
  });

  const [proyecciones, setProyecciones] = useState<any[]>([]);
  const [rentabilidad, setRentabilidad] = useState<any[]>([]);
  const [resumenRentabilidad, setResumenRentabilidad] = useState({
    totalCosto: 0,
    totalPrecio: 0,
    gananciaPotencial: 0,
  });

  const dateToWeb = (str: string) => {
    const p = str.split("/");
    if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
    return str;
  };
  const webToDate = (str: string) => {
    const p = str.split("-");
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return str;
  };
  const manejarCambioFecha = (
    texto: string,
    setFecha: (val: string) => void,
  ) => {
    const soloNumeros = texto.replace(/[^0-9]/g, "");
    let formateado = soloNumeros;
    if (soloNumeros.length > 2)
      formateado = soloNumeros.slice(0, 2) + "/" + soloNumeros.slice(2);
    if (soloNumeros.length > 4)
      formateado =
        soloNumeros.slice(0, 2) +
        "/" +
        soloNumeros.slice(2, 4) +
        "/" +
        soloNumeros.slice(4, 8);
    setFecha(formateado);
  };

  const cargarDatos = async (usarFiltroPersonalizado = false) => {
    if (!empresa) return;
    setLoading(true);

    let fInicio = undefined;
    let fFin = undefined;

    if (usarFiltroPersonalizado) {
      fInicio = Platform.OS === "web" ? fechaInicio : dateToWeb(fechaInicio);
      fFin = Platform.OS === "web" ? fechaFin : dateToWeb(fechaFin);
    }

    const [resumen, historial, extraData] = await Promise.all([
      obtenerResumenMensual(empresa.id_empresa, fInicio, fFin),
      obtenerHistorialGraficos(empresa.id_empresa),
      obtenerProyeccionesYRentabilidad(empresa.id_empresa),
    ]);

    setDatosMensuales(resumen);
    setHistorialGraficos(historial);
    setProyecciones(extraData.proyecciones);
    setRentabilidad(extraData.rentabilidad);
    setResumenRentabilidad(extraData.resumenRentabilidad);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos(false);
    }, [empresa]),
  );

  const getBadgeStyle = (estado: string) => {
    if (estado === "OK") return styles.badgeOk;
    if (estado === "Crítico") return styles.badgeBajo;
    if (estado === "Superávit") return styles.badgeSuperavit;
    return styles.badgeSinHistorial;
  };
  const getBadgeTxtStyle = (estado: string) => {
    if (estado === "OK") return styles.badgeTxtOk;
    if (estado === "Crítico") return styles.badgeTxtBajo;
    if (estado === "Superávit") return styles.badgeTxtSuperavit;
    return styles.badgeTxtSinHistorial;
  };

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
              
              .summary-container { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 30px; }
              .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; flex: 1; text-align: left; }
              .summary-box-green { background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; flex: 1; text-align: left; }
              .summary-box h3, .summary-box-green h3 { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; }
              .summary-box p { margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #0f172a; }
              .summary-box-green p { margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #16a34a; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; border: 1px solid #cbd5e1; }
              th, td { border: 1px solid #cbd5e1; padding: 12px 10px; text-align: left; }
              th { background-color: #ffffff; color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 11px; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .val-green { color: #16a34a; font-weight: bold; }
              
              .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; }
              .ok { background-color: #d1fae5; color: #047857; }
              .bajo { background-color: #fee2e2; color: #b91c1c; }
              .medio { background-color: #fef3c7; color: #b45309; }
              .superavit { background-color: #dbeafe; color: #1e40af; }
              .sin { background-color: #f1f5f9; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="fecha">Generado el ${new Date().toLocaleDateString("es-AR")}</div>
      `;

      if (tabActiva === "Resumen Mensual") {
        htmlContent += `
            <h1>Reporte de Resumen Mensual</h1>
            <div class="summary-container">
              <div class="summary-box"><h3>Ventas del Mes</h3><p>${datosMensuales.transacciones}</p></div>
              <div class="summary-box"><h3>Prod. Vendidos</h3><p>${datosMensuales.unidadesVendidas}</p></div>
              <div class="summary-box"><h3>Costos Totales</h3><p>$ ${Number(datosMensuales.costosTotales).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
              <div class="summary-box"><h3>Ganancia Neta</h3><p>$ ${Number(datosMensuales.gananciaNeta).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
            </div>
            <h2 style="color: #0f172a; margin-top: 30px; font-size: 18px; text-align:left;">Desglose Histórico (12 Meses)</h2>
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th style="text-align: center;">Ventas Creadas</th>
                  <th style="text-align: right;">Ingresos Totales</th>
                </tr>
              </thead>
              <tbody>
        `;

        Array.from({ length: 12 }).forEach((_, i) => {
          const indexReal = 11 - i;
          const mes = historialGraficos.labels[indexReal];
          const transacciones = historialGraficos.transacciones[indexReal];
          const ganancias = historialGraficos.ganancias[indexReal];

          if (mes !== "-") {
            htmlContent += `
              <tr>
                <td><strong>${mes} ${indexReal === 11 ? "(Actual)" : ""}</strong></td>
                <td style="text-align: center;">${transacciones} tickets</td>
                <td style="text-align: right;" class="val-green">$ ${Number(ganancias).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `;
          }
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
              : prod.estado === "Crítico"
                ? "bajo"
                : prod.estado === "Superávit"
                  ? "superavit"
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
              <td style="text-align:center;">$ ${Number(prod.costo).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="text-align:center;">$ ${Number(prod.precio).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="text-align:center;" class="val-green">+ $ ${Number(prod.ganancia).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="text-align:center;"><span class="badge ${prod.colorMargen}">${prod.margen}</span></td>
              <td style="text-align:center;"><strong>${prod.stock}</strong> uds.</td>
              <td style="text-align:right; font-weight:bold;">$ ${Number(prod.valCosto).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
              : Array(12).fill(0),
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
              : Array(12).fill(0),
        },
      ],
    };

    const isWeb = Platform.OS === "web";
    const anchoGrafico = 700;

    return (
      <View style={styles.tabContent}>
        <View style={styles.filterWrapper}>
          <Text style={styles.filterTitle}>Filtrar Resumen General</Text>
          <View style={{ flexDirection: isMobile ? "column" : "row", gap: 16 }}>
            <View style={isMobile ? { width: "100%" } : { flex: 1 }}>
              <Text style={styles.labelInput}>Fecha Inicio</Text>
              {Platform.OS === "web" ? (
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  style={
                    {
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "15px",
                      color: "#334155",
                      fontFamily: "inherit",
                      outline: "none",
                      boxSizing: "border-box",
                      minHeight: "44px",
                    } as any
                  }
                />
              ) : (
                <TextInput
                  style={styles.modalInputText}
                  placeholder="DD/MM/YYYY"
                  value={fechaInicio}
                  onChangeText={(t) => manejarCambioFecha(t, setFechaInicio)}
                  keyboardType="numeric"
                  maxLength={10}
                />
              )}
            </View>
            <View style={isMobile ? { width: "100%" } : { flex: 1 }}>
              <Text style={styles.labelInput}>Fecha Fin</Text>
              {Platform.OS === "web" ? (
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  style={
                    {
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "15px",
                      color: "#334155",
                      fontFamily: "inherit",
                      outline: "none",
                      boxSizing: "border-box",
                      minHeight: "44px",
                    } as any
                  }
                />
              ) : (
                <TextInput
                  style={styles.modalInputText}
                  placeholder="DD/MM/YYYY"
                  value={fechaFin}
                  onChangeText={(t) => manejarCambioFecha(t, setFechaFin)}
                  keyboardType="numeric"
                  maxLength={10}
                />
              )}
            </View>
            <View
              style={
                isMobile
                  ? { width: "100%", marginTop: 8 }
                  : { flex: 0.5, justifyContent: "flex-end" }
              }
            >
              <TouchableOpacity
                style={styles.btnFiltrar}
                onPress={() => cargarDatos(true)}
              >
                <Text style={styles.txtFiltrar}>Aplicar Filtro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <CardIndicador
            titulo="VENTAS DEL PERÍODO"
            valor={datosMensuales.transacciones.toString()}
            subtitulo="tickets creados"
          />
          <CardIndicador
            titulo="PRODUCTOS VENDIDOS"
            valor={datosMensuales.unidadesVendidas.toString()}
            subtitulo="unidades"
          />
          <CardIndicador
            titulo="COSTOS TOTALES"
            valor={`$ ${Number(datosMensuales.costosTotales).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitulo="costo mercadería"
          />
          <CardIndicador
            titulo="GANANCIA NETA"
            valor={`$ ${Number(datosMensuales.gananciaNeta).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitulo="ingresos - costos"
          />
        </View>

        <Text style={[styles.cardTituloGrafico, { marginLeft: 5 }]}>
          Histórico Anual (Últimos 12 meses)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          <View style={{ flexDirection: "row", gap: 16, paddingBottom: 10 }}>
            <View
              style={[
                styles.card,
                { width: anchoGrafico + 40, alignItems: "center" },
              ]}
            >
              <Text style={styles.cardTituloGrafico}>Ingresos Brutos ($)</Text>
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
                { width: anchoGrafico + 40, alignItems: "center" },
              ]}
            >
              <Text style={styles.cardTituloGrafico}>Tickets de Venta</Text>
              <LineChart
                data={dataVentas}
                width={anchoGrafico}
                height={220}
                yAxisLabel=""
                yAxisSuffix=" vtas"
                chartConfig={chartConfigLineas}
                bezier
                fromZero={true}
                withDots={!isMobile}
                style={{ borderRadius: 12, marginTop: 10 }}
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.tableCard, { marginTop: 10 }]}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Desglose Mes a Mes</Text>
            <Text style={styles.tableCardSub}>
              Toca un mes para ver las ventas (Tickets)
            </Text>
          </View>
          <View style={{ paddingTop: 10 }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const indexReal = 11 - i;
              const mes = historialGraficos.labels[indexReal];
              const transacciones = historialGraficos.transacciones[indexReal];
              const ganancias = historialGraficos.ganancias[indexReal];
              const ventasMes = historialGraficos.ventasPorMes[indexReal] || [];
              const estaExpandido = mesExpandido === indexReal;

              if (mes === "-") return null;

              return (
                <View key={indexReal} style={{ marginBottom: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.cardMobile,
                      isWeb && {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 14,
                      },
                      { marginBottom: 0 },
                    ]}
                    activeOpacity={0.7}
                    onPress={() =>
                      setMesExpandido(estaExpandido ? null : indexReal)
                    }
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
                            {mes} {indexReal === 11 && "(Actual)"}
                          </Text>
                        </View>
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text style={styles.rowTxtBase}>
                            Tickets:{" "}
                            <Text style={{ fontWeight: "bold" }}>
                              {transacciones}
                            </Text>
                          </Text>
                        </View>
                        <View
                          style={{
                            flex: 1,
                            alignItems: "flex-end",
                            paddingLeft: 10,
                            flexDirection: "row",
                            justifyContent: "flex-end",
                            gap: 15,
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
                            {Number(ganancias).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                          <Text style={{ fontSize: 16, color: "#94a3b8" }}>
                            {estaExpandido ? "▲" : "▼"}
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
                            {mes} {indexReal === 11 && "(Actual)"}
                          </Text>
                          <Text style={{ fontSize: 16, color: "#94a3b8" }}>
                            {estaExpandido ? "▲" : "▼"}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.cardRowMobile,
                            { marginTop: 4, marginBottom: 0 },
                          ]}
                        >
                          <Text style={styles.rowTxtSub}>
                            {transacciones} tickets de venta
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
                            ${" "}
                            {Number(ganancias).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* ACORDEON CON LOS TICKETS DEL MES */}
                  {estaExpandido && (
                    <View style={styles.accordionContent}>
                      {ventasMes.length === 0 ? (
                        <Text
                          style={{
                            color: "#94a3b8",
                            fontStyle: "italic",
                            textAlign: "center",
                            padding: 10,
                          }}
                        >
                          Sin ventas registradas en este mes.
                        </Text>
                      ) : (
                        ventasMes.map((venta: any) => {
                          const d = new Date(venta.fecha_venta);
                          const fechaCorta = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
                          return (
                            <View key={venta.id_venta} style={styles.ticketRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.ticketTitle}>
                                  Ticket #
                                  {venta.numero_ticket || venta.id_venta}
                                </Text>
                                <Text style={styles.ticketSub}>
                                  {fechaCorta} -{" "}
                                  {venta.cliente || "Consumidor Final"}
                                </Text>
                              </View>
                              <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.ticketTotal}>
                                  ${" "}
                                  {Number(venta.total).toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Text>
                                <Text style={styles.ticketVendedor}>
                                  Por:{" "}
                                  {venta.usuario?.nombre_usuario ||
                                    "Desconocido"}
                                </Text>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })}
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
          </View>

          <View style={{ paddingTop: 10, width: "100%" }}>
            {proyecciones.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}
              >
                No hay productos registrados con ventas.
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
                        <View style={getBadgeStyle(prod.estado)}>
                          <Text style={getBadgeTxtStyle(prod.estado)}>
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
                        <View style={getBadgeStyle(prod.estado)}>
                          <Text style={getBadgeTxtStyle(prod.estado)}>
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
              ${" "}
              {Number(resumenRentabilidad.totalCosto).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, minWidth: 200 }]}>
            <Text style={styles.cardTitulo}>VALOR STOCK A PRECIO VENTA</Text>
            <Text style={styles.cardValor}>
              ${" "}
              {Number(resumenRentabilidad.totalPrecio).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={[styles.cardPotencial, { flex: 1, minWidth: 200 }]}>
            <Text style={[styles.cardTitulo, { color: "#15803d" }]}>
              GANANCIA POTENCIAL EN STOCK
            </Text>
            <Text style={[styles.cardValor, { color: "#16a34a" }]}>
              ${" "}
              {Number(resumenRentabilidad.gananciaPotencial).toLocaleString(
                "es-AR",
                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
              )}
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
                          ${" "}
                          {Number(prod.costo).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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
                          ${" "}
                          {Number(prod.precio).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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
                          + ${" "}
                          {Number(prod.ganancia).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 0.8,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={
                            prod.colorMargen === "ok"
                              ? styles.badgeOk
                              : prod.colorMargen === "bajo"
                                ? styles.badgeBajo
                                : styles.badgeMedio
                          }
                        >
                          <Text
                            style={
                              prod.colorMargen === "ok"
                                ? styles.badgeTxtOk
                                : prod.colorMargen === "bajo"
                                  ? styles.badgeTxtBajo
                                  : styles.badgeTxtMedio
                            }
                          >
                            {prod.margen}
                          </Text>
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
                          ${" "}
                          {Number(prod.valCosto).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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
                        <View
                          style={
                            prod.colorMargen === "ok"
                              ? styles.badgeOk
                              : prod.colorMargen === "bajo"
                                ? styles.badgeBajo
                                : styles.badgeMedio
                          }
                        >
                          <Text
                            style={
                              prod.colorMargen === "ok"
                                ? styles.badgeTxtOk
                                : prod.colorMargen === "bajo"
                                  ? styles.badgeTxtBajo
                                  : styles.badgeTxtMedio
                            }
                          >
                            {prod.margen}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.rowTxtSub, { marginBottom: 12 }]}>
                        {prod.codigoMarca}
                      </Text>

                      <View style={styles.cardRowMobile}>
                        <Text style={styles.rowTxtBase}>
                          Costo:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            ${" "}
                            {Number(prod.costo).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </Text>
                        <Text style={styles.rowTxtBase}>
                          Precio:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            ${" "}
                            {Number(prod.precio).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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
                            ${" "}
                            {Number(prod.valCosto).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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
                            + ${" "}
                            {Number(prod.ganancia).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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

  filterWrapper: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  labelInput: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    fontWeight: "600",
  },
  modalInputText: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    minHeight: 44,
  },
  btnFiltrar: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  txtFiltrar: { color: "#ffffff", fontWeight: "bold" },

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

  accordionContent: {
    backgroundColor: "#f1f5f9",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  ticketSub: { fontSize: 13, color: "#64748b" },
  ticketTotal: { fontSize: 15, fontWeight: "bold", color: "#16a34a" },
  ticketVendedor: { fontSize: 11, color: "#94a3b8", marginTop: 2 },

  badgeOk: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTxtOk: { color: "#047857", fontSize: 12, fontWeight: "bold" },
  badgeBajo: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTxtBajo: { color: "#b91c1c", fontSize: 12, fontWeight: "bold" },
  badgeMedio: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTxtMedio: { color: "#b45309", fontSize: 12, fontWeight: "bold" },
  badgeSinHistorial: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTxtSinHistorial: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" },

  badgeSuperavit: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTxtSuperavit: { color: "#1e40af", fontSize: 12, fontWeight: "bold" },
});
