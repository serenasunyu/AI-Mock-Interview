const MainRoutes = [
    {
    label: "Home",
    href: "/",
    },
    {
    label: "Question Generator",
    href: "/questions",
    children: [
        {
            label: "Generate Questions",
            href: "/questions",
          },
        {
          label: "Question List",
          href: "/questions/question-list",
        },
        {
          label: "Mock Interview",
          href: "/questions/mock-interview",
        },
        {
          label: "Feedback",
          href: "/questions/mock-interview/feedback",
        }
      ]
    },
];

export default MainRoutes;