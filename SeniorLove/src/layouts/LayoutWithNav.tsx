import NavBar from "../components/NavBar/NavBar";

type Props = {
  children: React.ReactNode;
};

export default function LayoutWithNav({ children }: Props) {
  return (
    <div className="layout-app">
      <NavBar />
      <main className="layout-content">{children}</main>
    </div>
  );
}
