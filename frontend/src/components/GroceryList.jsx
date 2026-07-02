import GroceryItem from "./GroceryItem.jsx";

export default function GroceryList({ items, onUpdate, onDelete }) {
  if (items.length === 0) {
    return <p className="empty-state">Your grocery list is empty. Add something above!</p>;
  }

  return (
    <ul className="grocery-list">
      {items.map((item) => (
        <GroceryItem key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  );
}
