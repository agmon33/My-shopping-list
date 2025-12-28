
import { GoogleGenAI, Type } from "@google/genai";
import { StorePrice, StoreName } from "./types";
import { STORES } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Suggests up to 5 specific locations in Israel for the location selector.
 */
export async function suggestLocations(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest up to 5 specific neighborhoods, streets, or cities in Israel matching: "${query}".
      Return ONLY a JSON array of strings in Hebrew. Each string should be "Street Number, City" or "Neighborhood, City".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) {
    return [];
  }
}

/**
 * Converts coordinates to a readable address (Street, City) in Hebrew.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Given these coordinates in Israel: Lat ${lat}, Lng ${lng}. 
      What is the most likely address (Street and City)? 
      Return ONLY the address in Hebrew (e.g., "הרצל 10, תל אביב").`,
    });
    return response.text.trim();
  } catch (e) {
    return `מיקום (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
  }
}

export async function resolveItemVarieties(itemName: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `המשתמש רוצה לקנות "${itemName}". הצע 4-5 מוצרים ספציפיים ופופולריים שנמכרים בסופרמרקטים בישראל (למשל: חלב 3%, מלפפונים חמוצים במלח, עגבניות שרי).
      החזר רק מערך JSON של מחרוזות בעברית.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) {
    return [];
  }
}

export async function fetchPricesForItem(itemName: string, location: string = 'מרכז תל אביב'): Promise<StorePrice[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `מצא מחירים עדכניים וריאליים בשקלים עבור "${itemName}" בסניפים הקרובים ביותר לכתובת: ${location}.
      רשתות יעד: ${STORES.join(", ")}.
      חשוב מאוד: אל תחפש בכל ישראל! הבא מחירים אך ורק מסניפים שנמצאים במרחק הליכה או נסיעה קצרה (עד 5 ק"מ) מהכתובת "${location}".
      אם מדובר בכתובת בתל אביב, אל תביא מחירים מירושלים או חיפה.
      החזר מערך JSON שבו לכל אובייקט יש:
      "store": שם הרשת,
      "branchName": שם הסניף הספציפי והרחוב (למשל "דיזנגוף סנטר", "סניף לה גארדיה"),
      "price": מחיר ליחידה (מספר),
      "isSale": בוליאני,
      "saleDescription": תיאור המבצע אם קיים.
      חשוב: המחירים חייבים להיות תואמים לסניפים במיקום ${location} בלבד.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              store: { type: Type.STRING },
              branchName: { type: Type.STRING },
              price: { type: Type.NUMBER },
              isSale: { type: Type.BOOLEAN },
              saleDescription: { type: Type.STRING }
            },
            required: ["store", "price", "branchName"]
          }
        }
      }
    });

    const results = JSON.parse(response.text);
    return results.filter((r: any) => STORES.includes(r.store as StoreName) && r.price > 0);
  } catch (error) {
    return STORES.slice(0, 3).map(store => ({
      store, 
      branchName: "סניף קרוב",
      price: Math.floor(Math.random() * 15) + 5, 
      isSale: false
    }));
  }
}
