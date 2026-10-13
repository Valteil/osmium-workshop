package com.local.comfybridge

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.net.Inet4Address
import java.net.NetworkInterface

// The phone's own IPv4 addresses, for "Find PC": the WebView can't see them,
// and a PC on the phone's hotspot (or on the same Wi-Fi) sits in one of these
// subnets. Lists every interface that is up, not loopback, with its prefix
// length, so the JS side scans the right range. Read-only; no permission
// needed (NetworkInterface needs only INTERNET, which the app has).
@CapacitorPlugin(name = "NetInfo")
class NetInfoPlugin : Plugin() {

    @PluginMethod
    fun localAddresses(call: PluginCall) {
        val list = JSArray()
        try {
            for (nif in NetworkInterface.getNetworkInterfaces()?.toList() ?: emptyList()) {
                if (!nif.isUp || nif.isLoopback) continue
                for (ia in nif.interfaceAddresses) {
                    val addr = ia.address
                    if (addr !is Inet4Address) continue
                    val o = JSObject()
                    o.put("name", nif.name)
                    o.put("ip", addr.hostAddress)
                    o.put("prefix", ia.networkPrefixLength.toInt())
                    list.put(o)
                }
            }
        } catch (e: Exception) {
            call.reject("Could not read the phone's network addresses: ${e.message}")
            return
        }
        val ret = JSObject()
        ret.put("addresses", list)
        call.resolve(ret)
    }

    // Scans base.1-254 on each port with plain sockets (a WebView fetch scan
    // clogs Chromium's socket pool: aborted connects to silent addresses
    // linger, and the right address never gets a turn). An open port gets
    // GET /system_stats; it's a Comfy Bridge share when the reply carries
    // "relay" (both the Bridge relay and Persist Comfy's runner) or is a 401
    // naming the Comfy Bridge token. Returns ["http://ip:port", ...].
    @PluginMethod
    fun findBridges(call: PluginCall) {
        val subnets = call.getArray("subnets")?.toList<String>() ?: emptyList()
        val ports = (call.getArray("ports")?.toList<Any>() ?: listOf(8189)).map { (it as Number).toInt() }
        val connectMs = call.getInt("connectMs") ?: 400
        Thread {
            val found = java.util.Collections.synchronizedList(mutableListOf<String>())
            val pool = java.util.concurrent.Executors.newFixedThreadPool(64)
            for (base in subnets) for (i in 1..254) for (port in ports) {
                pool.execute {
                    val ip = "$base.$i"
                    try {
                        java.net.Socket().use { s ->
                            s.connect(java.net.InetSocketAddress(ip, port), connectMs)
                            s.soTimeout = 1500
                            s.getOutputStream().write("GET /system_stats HTTP/1.0\r\nHost: $ip\r\n\r\n".toByteArray())
                            val reply = s.getInputStream().readNBytesCompat(8192)
                            val is401 = reply.startsWith("HTTP/1.1 401") || reply.startsWith("HTTP/1.0 401")
                            if (reply.contains("\"relay\"") || (is401 && reply.contains("Comfy Bridge token", ignoreCase = true))) {
                                found.add("http://$ip:$port")
                            }
                        }
                    } catch (_: Exception) { /* nothing there */ }
                }
            }
            pool.shutdown()
            pool.awaitTermination(2, java.util.concurrent.TimeUnit.MINUTES)
            val ret = JSObject()
            ret.put("found", JSArray(found.sorted()))
            call.resolve(ret)
        }.start()
    }

    private fun java.io.InputStream.readNBytesCompat(max: Int): String {
        val buf = java.io.ByteArrayOutputStream()
        val chunk = ByteArray(2048)
        while (buf.size() < max) {
            val n = try { read(chunk) } catch (_: Exception) { -1 }
            if (n <= 0) break
            buf.write(chunk, 0, n)
        }
        return buf.toString("UTF-8")
    }
}
