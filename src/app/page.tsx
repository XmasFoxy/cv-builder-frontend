import { Button } from "@/components/ui/button";
import { Counter } from "@/components/counter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CV Builder</CardTitle>
        </CardHeader>

        <CardContent>
          <Button>Создать резюме</Button>
          <Counter />
        </CardContent>
      </Card>
    </main>
  );
}