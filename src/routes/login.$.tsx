import { SignIn } from "@clerk/tanstack-react-start";
import { Center } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

const LoginPage = () => (
  <Center mih="80vh" p="lg">
    <SignIn routing="path" path="/login" signUpUrl="/register" />
  </Center>
);

export const Route = createFileRoute("/login/$")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "ログイン | Photo" }] }),
});
