import { useClerk } from "@clerk/tanstack-react-start";
import { Button } from "@mantine/core";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };
  return (
    <Button color="red" variant="light" onClick={handleSignOut}>
      ログアウト
    </Button>
  );
};
