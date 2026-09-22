import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuramos cómo se van a comportar las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function obtenerTokenPushExpo(): Promise<string | null> {
  let token = null;

  // 1. Android necesita un "Canal" de notificaciones
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 2. Verificamos que sea un celular real (los simuladores de PC no reciben notificaciones)
  if (Device.isDevice) {
    // 3. Preguntamos si ya tenemos permiso
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 4. Si no tenemos permiso, lanzamos el cartelito en pantalla pidiéndolo
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Si el usuario le dio a "Denegar", nos rendimos y devolvemos null
    if (finalStatus !== 'granted') {
      console.log('Permiso denegado para notificaciones push');
      return null;
    }

    // 5. Si nos dio permiso, le pedimos a los servidores de Expo el Token único de este celular
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Token obtenido exitosamente:", token);
    } catch (error) {
      console.error("Error al obtener el token:", error);
    }
  } else {
    console.log('Debes usar un dispositivo físico para probar las notificaciones Push');
  }

  return token;
}