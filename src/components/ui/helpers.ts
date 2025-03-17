const MainRoutes = [
    {
    label: "Home",
    href: "/",
    },
    // {
    // label: "Dashboard",
    // href: "/dashboard",
    // },
    {
    label: "Question Generator",
    href: "/questions",
    children: [
        {
          label: "Generate Questions",
          href: "/questions/generate",
        },
        {
          label: "Question List",
          href: "/questions/list",
        },
        {
          label: "Custom Questions",
          href: "/questions/custom",
        },
        {
          label: "Saved Questions",
          href: "/questions/saved",
        }
      ]
    },
];

export default MainRoutes;