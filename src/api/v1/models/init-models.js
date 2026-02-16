import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _attribute_option from  "./attribute_option.js";
import _attribute_type from  "./attribute_type.js";
import _cart from  "./cart.js";
import _cart_product from  "./cart_product.js";
import _category from  "./category.js";
import _colour from  "./colour.js";
import _discount from  "./discount.js";
import _key_value_store from  "./key_value_store.js";
import _order_discount from  "./order_discount.js";
import _order_product from  "./order_product.js";
import _orders from  "./orders.js";
import _product from  "./product.js";
import _product_attribute from  "./product_attribute.js";
import _product_image from  "./product_image.js";
import _product_item from  "./product_item.js";
import _product_variation from  "./product_variation.js";
import _reservation from  "./reservation.js";
import _review from  "./review.js";
import _shipping_address from  "./shipping_address.js";
import _size_category from  "./size_category.js";
import _size_option from  "./size_option.js";
import _social_accounts from  "./social_accounts.js";
import _token_blacklist from  "./token_blacklist.js";
import _user from  "./user.js";
import _user_role from  "./user_role.js";
import _user_sessions from  "./user_sessions.js";

export default function initModels(sequelize) {
  const attribute_option = _attribute_option.init(sequelize, DataTypes);
  const attribute_type = _attribute_type.init(sequelize, DataTypes);
  const cart = _cart.init(sequelize, DataTypes);
  const cart_product = _cart_product.init(sequelize, DataTypes);
  const category = _category.init(sequelize, DataTypes);
  const colour = _colour.init(sequelize, DataTypes);
  const discount = _discount.init(sequelize, DataTypes);
  const key_value_store = _key_value_store.init(sequelize, DataTypes);
  const order_discount = _order_discount.init(sequelize, DataTypes);
  const order_product = _order_product.init(sequelize, DataTypes);
  const orders = _orders.init(sequelize, DataTypes);
  const product = _product.init(sequelize, DataTypes);
  const product_attribute = _product_attribute.init(sequelize, DataTypes);
  const product_image = _product_image.init(sequelize, DataTypes);
  const product_item = _product_item.init(sequelize, DataTypes);
  const product_variation = _product_variation.init(sequelize, DataTypes);
  const reservation = _reservation.init(sequelize, DataTypes);
  const review = _review.init(sequelize, DataTypes);
  const shipping_address = _shipping_address.init(sequelize, DataTypes);
  const size_category = _size_category.init(sequelize, DataTypes);
  const size_option = _size_option.init(sequelize, DataTypes);
  const social_accounts = _social_accounts.init(sequelize, DataTypes);
  const token_blacklist = _token_blacklist.init(sequelize, DataTypes);
  const user = _user.init(sequelize, DataTypes);
  const user_role = _user_role.init(sequelize, DataTypes);
  const user_sessions = _user_sessions.init(sequelize, DataTypes);

  product_attribute.belongsTo(attribute_option, { as: "attribute_option", foreignKey: "attribute_option_id"});
  attribute_option.hasMany(product_attribute, { as: "product_attributes", foreignKey: "attribute_option_id"});
  attribute_option.belongsTo(attribute_type, { as: "attribute_type", foreignKey: "attribute_type_id"});
  attribute_type.hasMany(attribute_option, { as: "attribute_options", foreignKey: "attribute_type_id"});
  cart_product.belongsTo(cart, { as: "cart", foreignKey: "cart_id"});
  cart.hasMany(cart_product, { as: "cart_products", foreignKey: "cart_id"});
  orders.belongsTo(cart, { as: "cart", foreignKey: "cart_id"});
  cart.hasMany(orders, { as: "orders", foreignKey: "cart_id"});
  category.belongsTo(category, { as: "parent_cat", foreignKey: "parent_cat_id"});
  category.hasMany(category, { as: "categories", foreignKey: "parent_cat_id"});
  product.belongsTo(category, { as: "category", foreignKey: "category_id"});
  category.hasMany(product, { as: "products", foreignKey: "category_id"});
  product_item.belongsTo(colour, { as: "colour", foreignKey: "colour_id"});
  colour.hasMany(product_item, { as: "product_items", foreignKey: "colour_id"});
  order_discount.belongsTo(discount, { as: "discount", foreignKey: "discount_id"});
  discount.hasMany(order_discount, { as: "order_discounts", foreignKey: "discount_id"});
  review.belongsTo(order_product, { as: "order_item", foreignKey: "order_item_id"});
  order_product.hasMany(review, { as: "reviews", foreignKey: "order_item_id"});
  order_discount.belongsTo(orders, { as: "order", foreignKey: "order_id"});
  orders.hasMany(order_discount, { as: "order_discounts", foreignKey: "order_id"});
  order_product.belongsTo(orders, { as: "order", foreignKey: "order_id"});
  orders.hasMany(order_product, { as: "order_products", foreignKey: "order_id"});
  order_product.belongsTo(product, { as: "product", foreignKey: "product_id"});
  product.hasMany(order_product, { as: "order_products", foreignKey: "product_id"});
  product_attribute.belongsTo(product, { as: "product", foreignKey: "product_id"});
  product.hasMany(product_attribute, { as: "product_attributes", foreignKey: "product_id"});
  product_item.belongsTo(product, { as: "product", foreignKey: "product_id"});
  product.hasMany(product_item, { as: "product_items", foreignKey: "product_id"});
  review.belongsTo(product, { as: "product", foreignKey: "product_id"});
  product.hasMany(review, { as: "reviews", foreignKey: "product_id"});
  order_product.belongsTo(product_item, { as: "product_item", foreignKey: "product_item_id"});
  product_item.hasMany(order_product, { as: "order_products", foreignKey: "product_item_id"});
  product_image.belongsTo(product_item, { as: "product_item", foreignKey: "product_item_id"});
  product_item.hasMany(product_image, { as: "product_images", foreignKey: "product_item_id"});
  product_variation.belongsTo(product_item, { as: "product_item", foreignKey: "product_item_id"});
  product_item.hasMany(product_variation, { as: "product_variations", foreignKey: "product_item_id"});
  cart_product.belongsTo(product_variation, { as: "variation", foreignKey: "variation_id"});
  product_variation.hasMany(cart_product, { as: "cart_products", foreignKey: "variation_id"});
  order_product.belongsTo(product_variation, { as: "variation", foreignKey: "variation_id"});
  product_variation.hasMany(order_product, { as: "order_products", foreignKey: "variation_id"});
  reservation.belongsTo(product_variation, { as: "variation", foreignKey: "variation_id"});
  product_variation.hasMany(reservation, { as: "reservations", foreignKey: "variation_id"});
  category.belongsTo(size_category, { as: "size_cat", foreignKey: "size_cat_id"});
  size_category.hasMany(category, { as: "categories", foreignKey: "size_cat_id"});
  size_option.belongsTo(size_category, { as: "size_cat", foreignKey: "size_cat_id"});
  size_category.hasMany(size_option, { as: "size_options", foreignKey: "size_cat_id"});
  product_variation.belongsTo(size_option, { as: "size", foreignKey: "size_id"});
  size_option.hasMany(product_variation, { as: "product_variations", foreignKey: "size_id"});
  cart.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasMany(cart, { as: "carts", foreignKey: "user_id"});
  order_discount.belongsTo(user, { as: "customer", foreignKey: "customer_id"});
  user.hasMany(order_discount, { as: "order_discounts", foreignKey: "customer_id"});
  orders.belongsTo(user, { as: "customer", foreignKey: "customer_id"});
  user.hasMany(orders, { as: "orders", foreignKey: "customer_id"});
  reservation.belongsTo(user, { as: "customer", foreignKey: "customer_id"});
  user.hasMany(reservation, { as: "reservations", foreignKey: "customer_id"});
  review.belongsTo(user, { as: "customer", foreignKey: "customer_id"});
  user.hasMany(review, { as: "reviews", foreignKey: "customer_id"});
  shipping_address.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasMany(shipping_address, { as: "shipping_addresses", foreignKey: "user_id"});
  social_accounts.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasOne(social_accounts, { as: "social_account", foreignKey: "user_id"});
  token_blacklist.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasMany(token_blacklist, { as: "token_blacklists", foreignKey: "user_id"});
  user_sessions.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasMany(user_sessions, { as: "user_sessions", foreignKey: "user_id"});
  user.belongsTo(user_role, { as: "role", foreignKey: "role_id"});
  user_role.hasMany(user, { as: "users", foreignKey: "role_id"});

  return {
    attribute_option,
    attribute_type,
    cart,
    cart_product,
    category,
    colour,
    discount,
    key_value_store,
    order_discount,
    order_product,
    orders,
    product,
    product_attribute,
    product_image,
    product_item,
    product_variation,
    reservation,
    review,
    shipping_address,
    size_category,
    size_option,
    social_accounts,
    token_blacklist,
    user,
    user_role,
    user_sessions,
  };
}
// import _sequelize from "sequelize";
// const DataTypes = _sequelize.DataTypes;
// import _attribute_option from "./attribute_option.js";
// import _attribute_type from "./attribute_type.js";
// import _cart from "./cart.js";
// import _cart_product from "./cart_product.js";
// import _category from "./category.js";
// import _colour from "./colour.js";
// import _discount from "./discount.js";
// import _key_value_store from "./key_value_store.js";
// import _order_discount from "./order_discount.js";
// import _order_product from "./order_product.js";
// import _orders from "./orders.js";
// import _product from "./product.js";
// import _product_attribute from "./product_attribute.js";
// import _product_image from "./product_image.js";
// import _product_item from "./product_item.js";
// import _product_variation from "./product_variation.js";
// import _reservation from "./reservation.js";
// import _review from "./review.js";
// import _shipping_address from "./shipping_address.js";
// import _size_category from "./size_category.js";
// import _size_option from "./size_option.js";
// import _social_accounts from "./social_accounts.js";
// import _token_blacklist from "./token_blacklist.js";
// import _user from "./user.js";
// import _user_role from "./user_role.js";
// import _user_sessions from "./user_sessions.js";

// let models = null;

// export default function initModels(sequelize) {
//   const attribute_option = _attribute_option.init(sequelize, DataTypes);
//   const attribute_type = _attribute_type.init(sequelize, DataTypes);
//   const cart = _cart.init(sequelize, DataTypes);
//   const cart_product = _cart_product.init(sequelize, DataTypes);
//   const category = _category.init(sequelize, DataTypes);
//   const colour = _colour.init(sequelize, DataTypes);
//   const discount = _discount.init(sequelize, DataTypes);
//   const key_value_store = _key_value_store.init(sequelize, DataTypes);
//   const order_discount = _order_discount.init(sequelize, DataTypes);
//   const order_product = _order_product.init(sequelize, DataTypes);
//   const orders = _orders.init(sequelize, DataTypes);
//   const product = _product.init(sequelize, DataTypes);
//   const product_attribute = _product_attribute.init(sequelize, DataTypes);
//   const product_image = _product_image.init(sequelize, DataTypes);
//   const product_item = _product_item.init(sequelize, DataTypes);
//   const product_variation = _product_variation.init(sequelize, DataTypes);
//   const reservation = _reservation.init(sequelize, DataTypes);
//   const review = _review.init(sequelize, DataTypes);
//   const shipping_address = _shipping_address.init(sequelize, DataTypes);
//   const size_category = _size_category.init(sequelize, DataTypes);
//   const size_option = _size_option.init(sequelize, DataTypes);
//   const social_accounts = _social_accounts.init(sequelize, DataTypes);
//   const token_blacklist = _token_blacklist.init(sequelize, DataTypes);
//   const user = _user.init(sequelize, DataTypes);
//   const user_role = _user_role.init(sequelize, DataTypes);
//   const user_sessions = _user_sessions.init(sequelize, DataTypes);

//   // associations (giữ nguyên phần bạn đã viết)

//   models = {
//     attribute_option,
//     attribute_type,
//     cart,
//     cart_product,
//     category,
//     colour,
//     discount,
//     key_value_store,
//     order_discount,
//     order_product,
//     orders,
//     product,
//     product_attribute,
//     product_image,
//     product_item,
//     product_variation,
//     reservation,
//     review,
//     shipping_address,
//     size_category,
//     size_option,
//     social_accounts,
//     token_blacklist,
//     user,
//     user_role,
//     user_sessions,
//   };

//   return models;
// }

// export function getModels() {
//   if (!models) {
//     throw new Error('❌ Models not initialized. Did you forget to call initModels(sequelize)?');
//   }
//   return models;
// }
