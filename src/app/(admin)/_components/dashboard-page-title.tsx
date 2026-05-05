type DashboardPageTitleProps = {
  title: string;
};

export default function DashboardPageTitle({ title }: DashboardPageTitleProps) {
  return (
    <section className="px-6 py-8">
      <h1 className="text-3xl font-bold text-heading">{title}</h1>
    </section>
  );
}
