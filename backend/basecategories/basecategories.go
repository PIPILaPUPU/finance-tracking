// Package basecategories describes the category set every user starts with.
// Migration 00008 seeds it for users that already existed; auth-app seeds it
// for every new user as part of registration. Keep both lists in sync.
package basecategories

type Category struct {
	Name  string
	Color string
	Icon  string
}

var All = []Category{
	{Name: "Питание", Color: "#FF8A3D", Icon: "food"},
	{Name: "Жилье", Color: "#EC4899", Icon: "home"},
	{Name: "Транспорт", Color: "#3B5BDB", Icon: "transport"},
	{Name: "Покупки", Color: "#F59E0B", Icon: "cart"},
	{Name: "Развлечения", Color: "#8B5CF6", Icon: "entertainment"},
	{Name: "Здоровье", Color: "#EF4444", Icon: "health"},
	{Name: "Образование", Color: "#0EA5E9", Icon: "education"},
	{Name: "Зарплата", Color: "#22C55E", Icon: "salary"},
	{Name: "Финансы", Color: "#14B8A6", Icon: "finance"},
	{Name: "Путешествия", Color: "#F97316", Icon: "travel"},
	{Name: "Связь", Color: "#6366F1", Icon: "internet"},
}

// Columns returns the list split into parallel slices, ready to be passed to
// a single UNNEST-based INSERT.
func Columns() (names, colors, icons []string) {
	names = make([]string, 0, len(All))
	colors = make([]string, 0, len(All))
	icons = make([]string, 0, len(All))
	for _, c := range All {
		names = append(names, c.Name)
		colors = append(colors, c.Color)
		icons = append(icons, c.Icon)
	}
	return names, colors, icons
}
