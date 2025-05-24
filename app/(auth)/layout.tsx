import { ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="auth-container">
      <section className="auth-form">
        <div className="auth-box">
          <div className="flex flex-row gap-3"></div>

          <div>{children}</div>
        </div>
      </section>
    </main>
  );
};

export default layout;
