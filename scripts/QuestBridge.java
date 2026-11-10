import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.lang.reflect.*;
import java.util.*;

/** Browser-only bridge: compiles Solution.java inside CheerpJ's virtual filesystem. */
public class QuestBridge {
  private static int sequence = 0;
  private static class LimitedOutput extends OutputStream {
    private final ByteArrayOutputStream bytes = new ByteArrayOutputStream();
    public void write(int b) { if (bytes.size() < 4096) bytes.write(b); }
    public String text() { return new String(bytes.toByteArray(), StandardCharsets.UTF_8); }
  }
  private static String quote(String text) {
    StringBuilder out = new StringBuilder("\"");
    for (char c : text.toCharArray()) {
      if (c == '"' || c == '\\') out.append('\\').append(c);
      else if (c == '\n') out.append("\\n");
      else if (c == '\r') out.append("\\r");
      else if (c == '\t') out.append("\\t");
      else if (c < 32) out.append(' ');
      else out.append(c);
    }
    return out.append('"').toString();
  }
  public static String grade(String source, String kind, String cases) throws Exception {
    JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    if (compiler == null) return "{\"error\":\"The Java compiler could not start. Retry the runtime or download your source.\"}";
    Path folder = Paths.get(System.getProperty("quest.workdir", "/files/dsa-quest"), "run-" + (++sequence));
    Files.createDirectories(folder);
    Path sourceFile = folder.resolve("Solution.java");
    Files.write(sourceFile, source.getBytes(StandardCharsets.UTF_8));
    LimitedOutput diagnostics = new LimitedOutput();
    int status = compiler.run(null, diagnostics, diagnostics, "-encoding", "UTF-8", "-d", folder.toString(), sourceFile.toString());
    if (status != 0) return "{\"error\":" + quote(diagnostics.text()) + "}";
    PrintStream originalOut = System.out, originalErr = System.err;
    LimitedOutput output = new LimitedOutput();
    try (URLClassLoader loader = new URLClassLoader(new URL[]{folder.toUri().toURL()})) {
      Class<?> solution = Class.forName("Solution", true, loader);
      Class<?>[] types = kind.equals("pair") ? new Class<?>[]{int.class,int.class} : kind.equals("single") ? new Class<?>[]{int.class} : kind.equals("target") ? new Class<?>[]{int[].class,int.class} : new Class<?>[]{int[].class};
      Method solve = solution.getMethod("solve", types);
      if (!Modifier.isStatic(solve.getModifiers())) return "{\"error\":\"Keep solve public static so the tests can call it.\"}";
      StringBuilder result = new StringBuilder("{\"results\":[");
      String[] rows = cases.split("\n", -1);
      for (int r=0; r<rows.length; r++) {
        if (r>0) result.append(',');
        try {
          String[] cells = rows[r].split(";", -1);
          Object[] args = new Object[types.length];
          for(int i=0;i<types.length;i++) {
            if(types[i] == int[].class) args[i] = cells[i].isEmpty() ? new int[0] : Arrays.stream(cells[i].split(",")).mapToInt(Integer::parseInt).toArray();
            else args[i] = Integer.valueOf(cells[i]);
          }
          System.setOut(new PrintStream(output)); System.setErr(new PrintStream(output));
          Object actual = solve.invoke(null, args);
          if(actual instanceof Integer) result.append("{\"actual\":").append(actual).append('}');
          else if(actual instanceof int[]) result.append("{\"actual\":").append(Arrays.toString((int[])actual)).append('}');
          else result.append("{\"error\":\"Return an int or int[] matching the exercise contract.\"}");
        } catch (Throwable error) {
          Throwable cause = error instanceof InvocationTargetException ? error.getCause() : error;
          result.append("{\"error\":").append(quote(cause.toString())).append('}');
        } finally { System.setOut(originalOut); System.setErr(originalErr); }
      }
      return result.append("],\"stdout\":").append(quote(output.text())).append('}').toString();
    } catch (Throwable error) { return "{\"error\":" + quote(error.toString()) + "}"; }
    finally { System.setOut(originalOut); System.setErr(originalErr); }
  }
}
