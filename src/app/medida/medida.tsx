import { useEmpresa } from "@/context/empresaContext";
import {
  crearMedida,
  editarMedida,
  eliminarMedida,
  getMedidas,
} from "@/service/medida";
import { Medida } from "@/types/types";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

export default function GestionarMedidas({ onClose }: { onClose: () => void }) {
  const { empresa } = useEmpresa();
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorVisible, setErrorVisible] = useState("");

  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [abreviacion, setAbreviacion] = useState("");
  const [permiteDecimales, setPermiteDecimales] = useState(false);

  const cargarMedidas = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    const data = await getMedidas(empresa.id_empresa);
    setMedidas(data);
    setLoading(false);
  }, [empresa]);

  useEffect(() => {
    cargarMedidas();
  }, [cargarMedidas]);

  const manejarGuardado = async () => {
    if (!empresa) return;
    setErrorVisible("");

    if (nombre.trim() === "" || abreviacion.trim() === "") {
      setErrorVisible("Por favor, completá el nombre y la abreviación.");
      return;
    }

    setGuardando(true);
    let resultado;

    if (idEditando) {
      resultado = await editarMedida(
        idEditando,
        empresa.id_empresa,
        nombre,
        abreviacion,
        permiteDecimales,
      );
    } else {
      resultado = await crearMedida(
        empresa.id_empresa,
        nombre,
        abreviacion,
        permiteDecimales,
      );
    }

    if (resultado.exito) {
      setNombre("");
      setAbreviacion("");
      setPermiteDecimales(false);
      setIdEditando(null);
      await cargarMedidas();
    } else {
      setErrorVisible(
        resultado.msj || "Error desconocido al guardar en base de datos.",
      );
    }
    setGuardando(false);
  };

  const prepararEdicion = (medida: Medida) => {
    setErrorVisible("");
    setIdEditando(medida.id_medida);
    setNombre(medida.nombre_tipo);
    setAbreviacion(medida.abreviacion || "");
    setPermiteDecimales(Boolean(medida.permite_decimales));
  };

  const confirmarEliminar = (medida: Medida) => {
    if (!empresa) return;
    if (Platform.OS === "web") {
      if (
        window.confirm(`¿Seguro que querés eliminar "${medida.nombre_tipo}"?`)
      ) {
        ejecutarEliminacion(medida.id_medida);
      }
    } else {
      Alert.alert(
        "Eliminar",
        `¿Seguro que querés eliminar "${medida.nombre_tipo}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => ejecutarEliminacion(medida.id_medida),
          },
        ],
      );
    }
  };

  const ejecutarEliminacion = async (id: number) => {
    if (!empresa) return;
    setLoading(true);
    const resultado = await eliminarMedida(id, empresa.id_empresa);
    if (resultado.exito) {
      await cargarMedidas();
    } else {
      setErrorVisible(
        "No se puede eliminar. ¿Hay productos usándola? Detalle: " +
          resultado.msj,
      );
    }
    setLoading(false);
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Tipos de Venta</Text>
        <Pressable onPress={onClose} style={styles.btnCerrar}>
          <Text style={styles.txtCerrar}>✕</Text>
        </Pressable>
      </View>

      <Text style={styles.descripcion}>
        Los tipos de venta definen cómo se mide un producto (por kilo, unidad,
        metro, etc.) y se usan al crear productos y en el POS de ventas.
      </Text>

      <View style={styles.listaContenedor}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#2563eb"
            style={{ padding: 20 }}
          />
        ) : (
          <FlatList
            data={medidas}
            keyExtractor={(item) => item.id_medida.toString()}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => (
              <View style={styles.filaMedida}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <Text style={styles.txtNombre}>{item.nombre_tipo}</Text>

                  {item.abreviacion ? (
                    <View style={styles.badgeAbrev}>
                      <Text style={styles.txtBadgeAbrev}>
                        {item.abreviacion}
                      </Text>
                    </View>
                  ) : null}

                  {item.permite_decimales ? (
                    <Text style={styles.txtDecimalesBadge}>
                      (Acepta decimales)
                    </Text>
                  ) : (
                    <Text style={styles.txtNoDecimalesBadge}>
                      (No acepta decimales)
                    </Text>
                  )}
                </View>

                <View style={styles.accionesRow}>
                  <Pressable onPress={() => prepararEdicion(item)}>
                    <Text style={styles.iconoEditar}>✏️</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmarEliminar(item)}>
                    <Text style={styles.iconoEliminar}>❌</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text
                style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}
              >
                No hay medidas.
              </Text>
            }
          />
        )}
      </View>

      {errorVisible !== "" && (
        <View style={styles.cajaError}>
          <Text style={styles.txtError}>⚠️ Error: {errorVisible}</Text>
        </View>
      )}

      <View style={styles.formularioAgregar}>
        <View style={styles.inputsRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Nombre (ej: Rollo)"
            value={nombre}
            onChangeText={setNombre}
            editable={!guardando}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Abrev."
            value={abreviacion}
            onChangeText={setAbreviacion}
            maxLength={5}
            editable={!guardando}
          />
          <Pressable
            style={[styles.btnAgregar, guardando && { opacity: 0.6 }]}
            onPress={manejarGuardado}
            disabled={guardando}
          >
            <Text style={styles.txtBtnAgregar}>
              {guardando
                ? "Guardando..."
                : idEditando
                  ? "Guardar"
                  : "+ Agregar"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.switchRow}>
          <Switch
            value={permiteDecimales}
            onValueChange={setPermiteDecimales}
            trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
            thumbColor={permiteDecimales ? "#2563eb" : "#f1f5f9"}
            disabled={guardando}
          />
          <Text style={styles.txtSwitch}>
            Permitir ventas con decimales (ej: 1.5)
          </Text>
        </View>

        {idEditando && (
          <Pressable
            onPress={() => {
              setIdEditando(null);
              setNombre("");
              setAbreviacion("");
              setPermiteDecimales(false);
              setErrorVisible("");
            }}
            style={{ marginTop: 10, alignItems: "center" }}
          >
            <Text
              style={{ color: "#ef4444", fontWeight: "bold", fontSize: 13 }}
            >
              Cancelar Edición
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  titulo: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  btnCerrar: { padding: 5 },
  txtCerrar: { fontSize: 18, color: "#64748b", fontWeight: "bold" },
  descripcion: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 20,
  },

  listaContenedor: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 15,
  },
  filaMedida: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  txtNombre: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  txtDecimalesBadge: { fontSize: 12, color: "#059669", fontWeight: "bold" },
  txtNoDecimalesBadge: { fontSize: 12, color: "#ef4444", fontWeight: "bold" },
  badgeAbrev: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  txtBadgeAbrev: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#475569",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  accionesRow: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    paddingLeft: 10,
  },
  iconoEditar: { fontSize: 18, color: "#3b82f6" },
  iconoEliminar: { fontSize: 16, color: "#ef4444" },

  cajaError: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  txtError: { color: "#b91c1c", fontWeight: "bold", fontSize: 13 },

  formularioAgregar: { marginTop: 5 },
  inputsRow: { flexDirection: "row", gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  btnAgregar: {
    backgroundColor: "#93c5fd",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  txtBtnAgregar: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  txtSwitch: { fontSize: 13, color: "#475569", fontWeight: "500" },
});
