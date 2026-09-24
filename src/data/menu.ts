const tiffinImage = "";
const payasamImage = "";
const feastImage = "";
const functionImage = "";
const nonVegImage = "";

/**
 * MENU CONTENT
 * Categories and items are configuration, not hardcoded UI. Replace these
 * with the categories and dishes the business actually offers. `price` and
 * `tags` are optional and are only rendered when supplied.
 */

export const AVAILABLE_TAGS = [
  "Vegetarian", "Non-Vegetarian", "Vegan", "Gluten-Free", "Popular", 
  "Chef's Special", "Signature", "Spicy", "Sweet", "Healthy", 
  "Bestseller", "New", "Kids Favorite", "Breakfast", "Lunch", 
  "Dinner", "Snack", "Beverage", "Dessert", "Starter", 
  "Main Course", "Side Dish"
] as const;

export type MenuTag = typeof AVAILABLE_TAGS[number];

export type MenuCategory = {
  id: string;
  name: string;
  description: string;
  image?: string;
  alt?: string;
  order?: number;
};

export type MenuSubcategory = {
  id: string;
  categoryId: string;
  name: string;
  order?: number;
};

export type MenuItem = {
  id: string;
  category: string;
  subcategoryId?: string;
  name: string;
  description: string;
  image?: string;
  price?: string;
  tags?: MenuTag[];
  order?: number;
};

export const menuCategories: MenuCategory[] = [
  {
    id: "breakfast",
    name: "Breakfast",
    description: "Classic morning favourites and traditional tiffin items.",
    image: tiffinImage,
    alt: "South Indian tiffin spread with idli, dosa, and vada",
    order: 0,
  },
  {
    id: "lunch",
    name: "Traditional Lunch",
    description: "Authentic vegetarian rice preparations, curries and vegetable sides.",
    image: feastImage,
    alt: "South Indian vegetarian lunch feast",
    order: 1,
  },
  {
    id: "non-veg",
    name: "Non-Veg",
    description: "Premium chicken, mutton and seafood specialties.",
    image: nonVegImage,
    alt: "Non-vegetarian South Indian dishes",
    order: 2,
  },
  {
    id: "dinner",
    name: "Dinner",
    description: "Layered parottas, soft kal dosas, and evening specialties.",
    image: functionImage,
    alt: "South Indian dinner items",
    order: 3,
  },
  {
    id: "sweets",
    name: "Sweets",
    description: "Traditional South Indian sweets and desserts.",
    image: payasamImage,
    alt: "South Indian sweets",
    order: 4,
  },
];

export const menuItems: MenuItem[] = [
  // BREAKFAST
  { id: "bf-1", category: "breakfast", name: "Idli", description: "Soft, steamed rice-lentil cakes.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/idly.png?alt=media", tags: ["Vegetarian", "Popular"] },
  { id: "bf-2", category: "breakfast", name: "Dosa", description: "Classic crispy fermented crepe.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/dosa.png?alt=media", tags: ["Vegetarian"] },
  { id: "bf-3", category: "breakfast", name: "Masala Dosa", description: "Crispy dosa with spiced potato filling.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/masaldosa.png?alt=media", tags: ["Vegetarian", "Signature"] },
  { id: "bf-4", category: "breakfast", name: "Medu Vada", description: "Crispy urad-dal fritter.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/meduvada.png?alt=media", tags: ["Vegetarian", "Popular"] },
  { id: "bf-5", category: "breakfast", name: "Ven Pongal", description: "Rice and moong dal cooked with pepper, cumin & ghee.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/venpongal.png?alt=media", tags: ["Vegetarian"] },
  { id: "bf-6", category: "breakfast", name: "Uthappam", description: "Thick, soft dosa topped with vegetables.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/uthappam.png?alt=media", tags: ["Vegetarian"] },
  { id: "bf-7", category: "breakfast", name: "Paniyaram", description: "Small fermented rice-lentil cakes, crispy outside.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Paniyaram.png?alt=media", tags: ["Vegetarian"] },
  { id: "bf-9", category: "breakfast", name: "Poori Masala", description: "Deep-fried wheat bread served with potato curry.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/poorimasala.png?alt=media", tags: ["Vegetarian", "Popular"] },

  // TRADITIONAL LUNCH
  // Rices
  { id: "lun-15", category: "lunch", name: "White Rice", description: "Freshly steamed traditional Ponni rice.", image: feastImage, tags: ["Vegetarian"] },
  { id: "lun-11", category: "lunch", name: "Lemon Rice", description: "Tangy rice flavoured with fresh lemon and tempered spices.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/LemonRice.png?alt=media", tags: ["Vegetarian"] },
  { id: "lun-12", category: "lunch", name: "Tamarind Rice", description: "Spicy and tangy puli sadam.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/TamarindRice.png?alt=media", tags: ["Vegetarian"] },
  { id: "lun-13", category: "lunch", name: "Coconut Rice", description: "Mild rice flavoured with fresh grated coconut.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/coconutrice.png?alt=media", tags: ["Vegetarian"] },
  { id: "lun-14", category: "lunch", name: "Curd Rice", description: "Comforting rice mixed with seasoned yogurt.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/curdrice.png?alt=media", tags: ["Vegetarian", "Popular"] },

  // Curries
  { id: "lun-1", category: "lunch", name: "Sambar", description: "Classic lentil and vegetable stew.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/sambar.png?alt=media", tags: ["Vegetarian", "Signature"] },
  { id: "lun-2", category: "lunch", name: "Rasam", description: "Spicy, tangy tamarind soup.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Rasam.png?alt=media", tags: ["Vegetarian"] },
  { id: "lun-3", category: "lunch", name: "Kara Kuzhambu", description: "Spicy tamarind-based curry.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/KaraKuzhambu.png?alt=media", tags: ["Vegetarian"] },
  { id: "lun-4", category: "lunch", name: "Mor Kuzhambu", description: "Mild spiced yogurt and coconut curry.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/MorKuzhambu.png?alt=media", tags: ["Vegetarian"] },
  { id: "lun-6", category: "lunch", name: "Kootu", description: "Vegetables and lentils cooked in coconut paste.", image: feastImage, tags: ["Vegetarian"] },

  // Sides
  { id: "lun-5", category: "lunch", name: "Poriyal", description: "Lightly stir-fried seasonal vegetables with coconut.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Poriyal.png?alt=media", tags: ["Vegetarian"] },
  { id: "lun-7", category: "lunch", name: "Avial", description: "Mixed vegetables cooked in a rich coconut and yogurt paste.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Avial.png?alt=media", tags: ["Vegetarian", "Signature"] },
  { id: "lun-8", category: "lunch", name: "Keerai", description: "Healthy traditional spinach preparation.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Keerai.png?alt=media", tags: ["Vegetarian"] },
  { id: "lun-9", category: "lunch", name: "Potato Roast", description: "Spicy, crispy pan-roasted potatoes.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/PotatoRoast.png?alt=media", tags: ["Vegetarian", "Popular"] },
  { id: "lun-10", category: "lunch", name: "Vazhakkai Varuval", description: "Crispy raw banana fry.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/VazhakkaiVaruval.png?alt=media", tags: ["Vegetarian"] },

  // NON-VEG
  // Rices
  { id: "nv-6", category: "non-veg", name: "Mutton Biryani", description: "Seeraga samba rice cooked with tender mutton.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Mutton%20Biryani.png?alt=media", tags: ["Non-Vegetarian", "Popular"] },
  { id: "nv-7", category: "non-veg", name: "Ambur Biryani", description: "Distinctive biryani style from Ambur.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Ambur%20Biryani.png?alt=media", tags: ["Non-Vegetarian"] },
  { id: "nv-8", category: "non-veg", name: "Dindigul Biryani", description: "Famous seeraga samba biryani from Dindigul.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Dindigul%20Biryani.png?alt=media", tags: ["Non-Vegetarian"] },

  // Curries
  { id: "nv-1", category: "non-veg", name: "Chicken Chettinad", description: "Intensely spiced Chettinad-style curry.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Chicken%20Chettinad.png?alt=media", tags: ["Non-Vegetarian", "Chef's Special"] },
  { id: "nv-2", category: "non-veg", name: "Nattu Kozhi Kuzhambu", description: "Country chicken curry prepared with traditional spices.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Nattu%20Kozhi%20Kuzhambu.png?alt=media", tags: ["Non-Vegetarian", "Signature"] },
  { id: "nv-5", category: "non-veg", name: "Mutton Kuzhambu", description: "Traditional Tamil-style rich mutton curry.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Mutton%20Kuzhambu.png?alt=media", tags: ["Non-Vegetarian"] },
  { id: "nv-9", category: "non-veg", name: "Fish Kuzhambu", description: "Tangy and spicy South Indian fish curry.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Fish%20Kuzhambu.png?alt=media", tags: ["Non-Vegetarian"] },
  { id: "nv-11", category: "non-veg", name: "Prawn Masala", description: "Succulent prawns cooked in a thick, spicy gravy.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Prawn%20Masala.png?alt=media", tags: ["Non-Vegetarian", "Chef's Special"] },

  // Sides
  { id: "nv-3", category: "non-veg", name: "Chicken 65", description: "Crispy, spicy deep-fried chicken starter.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Chicken%2065.png?alt=media", tags: ["Non-Vegetarian", "Popular"] },
  { id: "nv-4", category: "non-veg", name: "Mutton Chukka", description: "Dry roasted tender mutton with pepper and spices.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Mutton%20Chukka.png?alt=media", tags: ["Non-Vegetarian", "Signature"] },
  { id: "nv-10", category: "non-veg", name: "Fish Fry", description: "Crispy, spice-marinated shallow-fried fish.", image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Fish%20Fry.png?alt=media", tags: ["Non-Vegetarian", "Popular"] },

  // DINNER
  { id: "din-1", category: "dinner", name: "Parotta", description: "Layered, flaky flatbread served with salna.", image: functionImage, tags: ["Vegetarian", "Popular"] },
  { id: "din-2", category: "dinner", name: "Kothu Parotta", description: "Chopped parotta stir-fried with vegetables.", image: functionImage, tags: ["Vegetarian"] },
  { id: "din-3", category: "dinner", name: "Egg Kothu Parotta", description: "Chopped parotta cooked with egg and spices.", image: functionImage, tags: ["Non-Vegetarian"] },
  { id: "din-4", category: "dinner", name: "Chicken Kothu Parotta", description: "Chopped parotta cooked with chicken curry.", image: functionImage, tags: ["Non-Vegetarian", "Popular"] },
  { id: "din-5", category: "dinner", name: "Chapati + Kurma", description: "Soft chapatis served with vegetable kurma.", image: functionImage, tags: ["Vegetarian"] },
  { id: "din-6", category: "dinner", name: "Kal Dosa", description: "Soft, thick dosa perfect for absorbing curries.", image: functionImage, tags: ["Vegetarian", "Signature"] },
  { id: "din-7", category: "dinner", name: "Appam", description: "Bowl-shaped thin pancakes made from fermented rice batter.", image: functionImage, tags: ["Vegetarian"] },
  { id: "din-8", category: "dinner", name: "Idiyappam", description: "String hoppers made from rice flour.", image: functionImage, tags: ["Vegetarian"] },

  // SWEETS
  { id: "sw-1", category: "sweets", name: "Mysore Pak", description: "Rich, melt-in-the-mouth gram flour and ghee sweet.", image: payasamImage, tags: ["Vegetarian", "Popular"] },
  { id: "sw-2", category: "sweets", name: "Jangiri", description: "Syrup-soaked intricate urad dal sweet.", image: payasamImage, tags: ["Vegetarian"] },
  { id: "sw-3", category: "sweets", name: "Adhirasam", description: "Deep-fried rice flour and jaggery sweet.", image: payasamImage, tags: ["Vegetarian", "Traditional"] as any },
  { id: "sw-4", category: "sweets", name: "Sakkarai Pongal", description: "Sweetened rice cooked with jaggery and ghee.", image: payasamImage, tags: ["Vegetarian", "Signature"] },
  { id: "sw-5", category: "sweets", name: "Kesari", description: "Semolina sweet cooked with ghee and saffron.", image: payasamImage, tags: ["Vegetarian"] },
  { id: "sw-6", category: "sweets", name: "Payasam", description: "Traditional liquid dessert made with milk, rice or dal.", image: payasamImage, tags: ["Vegetarian", "Popular"] },
  { id: "sw-7", category: "sweets", name: "Tirunelveli Halwa", description: "Famous wheat and ghee halwa.", image: payasamImage, tags: ["Vegetarian", "Signature"] },
  { id: "sw-8", category: "sweets", name: "Boli", description: "Sweet stuffed flatbread.", image: payasamImage, tags: ["Vegetarian"] },
  { id: "sw-9", category: "sweets", name: "Kozhukattai", description: "Steamed rice dumplings with sweet coconut filling.", image: payasamImage, tags: ["Vegetarian"] },
];

export const itemsByCategory = (categoryId: string) =>
  menuItems.filter((item) => item.category === categoryId);
